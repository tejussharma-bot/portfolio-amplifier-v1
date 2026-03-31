const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const { pool } = require("../database/config");
const { authenticateToken } = require("../middleware/auth");
const { generatePortfolioDraft } = require("../services/ai");

const uploadDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({ dest: uploadDir });
const router = express.Router();

router.use(authenticateToken);

function parseJsonArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

async function getOwnedProject(projectId, userId) {
  const result = await pool.query(
    `SELECT p.*, pf.content_json, pf.is_published, pf.public_slug
     FROM projects p
     LEFT JOIN portfolios pf ON pf.project_id = p.id
     WHERE p.id = $1 AND p.user_id = $2`,
    [projectId, userId]
  );

  return result.rows[0];
}

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, pf.is_published, pf.public_slug
       FROM projects p
       LEFT JOIN portfolios pf ON pf.project_id = p.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.userId]
    );

    return res.json({ projects: result.rows });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/:projectId", async (req, res) => {
  try {
    const project = await getOwnedProject(req.params.projectId, req.user.userId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const [drafts, latestAnalysis] = await Promise.all([
      pool.query(
        `SELECT * FROM generated_content
         WHERE project_id = $1
         ORDER BY created_at DESC`,
        [req.params.projectId]
      ),
      pool.query(
        `SELECT * FROM analysis_results
         WHERE project_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [req.params.projectId]
      )
    ]);

    return res.json({
      project,
      drafts: drafts.rows,
      analysis: latestAnalysis.rows[0] || null
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/", upload.array("assets", 10), async (req, res) => {
  const {
    title,
    client_name,
    category,
    industry,
    timeline,
    source_url,
    challenge,
    solution,
    results,
    deliverables,
    testimonials
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Project title is required" });
  }

  const assetPaths = (req.files || []).map((file) => ({
    originalName: file.originalname,
    path: file.path.replace(/\\/g, "/"),
    mimetype: file.mimetype,
    size: file.size
  }));

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const projectResult = await client.query(
      `INSERT INTO projects (
         user_id,
         title,
         client_name,
         category,
         industry,
         timeline,
         source_url,
         status,
         challenge_text,
         solution_text,
         results_text,
         deliverables,
         assets_url,
         testimonials
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'structuring', $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        req.user.userId,
        title,
        client_name || null,
        category || null,
        industry || null,
        timeline || null,
        source_url || null,
        challenge || null,
        solution || null,
        results || null,
        JSON.stringify(parseJsonArray(deliverables)),
        JSON.stringify(assetPaths),
        JSON.stringify(parseJsonArray(testimonials))
      ]
    );

    const project = projectResult.rows[0];
    const portfolioDraft = await generatePortfolioDraft(project);
    const publicSlug = `${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}-${uuidv4().slice(0, 8)}`;

    await client.query(
      `INSERT INTO portfolios (project_id, content_json, public_slug)
       VALUES ($1, $2, $3)`,
      [project.id, JSON.stringify(portfolioDraft), publicSlug]
    );

    await client.query(
      `UPDATE projects
       SET status = 'ready', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [project.id]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      project: {
        ...project,
        status: "ready"
      },
      portfolioDraft
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

router.post("/:projectId/generate-portfolio", async (req, res) => {
  try {
    const project = await getOwnedProject(req.params.projectId, req.user.userId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const portfolioDraft = await generatePortfolioDraft(project);

    await pool.query(
      `INSERT INTO portfolios (project_id, content_json, public_slug)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id)
       DO UPDATE SET
         content_json = EXCLUDED.content_json,
         updated_at = CURRENT_TIMESTAMP`,
      [
        project.id,
        JSON.stringify(portfolioDraft),
        `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${uuidv4().slice(0, 8)}`
      ]
    );

    await pool.query(
      `UPDATE projects
       SET status = 'ready', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [project.id]
    );

    return res.json({ portfolioDraft });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.put("/:projectId/portfolio", async (req, res) => {
  const { contentJson, isPublished = false } = req.body;

  try {
    const project = await getOwnedProject(req.params.projectId, req.user.userId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const publicSlug =
      project.public_slug ||
      `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${uuidv4().slice(0, 8)}`;

    const result = await pool.query(
      `UPDATE portfolios
       SET content_json = $1,
           is_published = $2,
           public_slug = $3,
           published_at = CASE WHEN $2 THEN CURRENT_TIMESTAMP ELSE published_at END,
           updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $4
       RETURNING *`,
      [JSON.stringify(contentJson), isPublished, publicSlug, project.id]
    );

    await pool.query(
      `UPDATE projects
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [isPublished ? "published" : "ready", project.id]
    );

    return res.json({ portfolio: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
