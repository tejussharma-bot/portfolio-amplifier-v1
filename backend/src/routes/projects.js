const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const { pool } = require("../database/config");
const { authenticateToken } = require("../middleware/auth");
const { generatePortfolioDraft } = require("../services/ai");
const { storeProjectAsset } = require("../services/storage");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 10
  }
});
const router = express.Router();

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

function slugify(value) {
  return String(value || "project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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

router.get("/public/:slug", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.title, p.client_name, p.category, p.industry, p.timeline, p.challenge_text,
              p.solution_text, p.results_text, p.deliverables, p.assets_url, p.testimonials,
              pf.content_json, pf.public_slug, pf.published_at
       FROM portfolios pf
       INNER JOIN projects p ON p.id = pf.project_id
       WHERE pf.public_slug = $1 AND pf.is_published = TRUE
       LIMIT 1`,
      [req.params.slug]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Published portfolio not found" });
    }

    return res.json({ portfolio: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.use(authenticateToken);

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
  let client;

  try {
    client = await pool.connect();
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
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'structuring', $8, $9, $10, $11, '[]'::jsonb, $12)
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
        JSON.stringify(parseJsonArray(testimonials))
      ]
    );

    const storedAssets = await Promise.all(
      (req.files || []).map((file, index) =>
        storeProjectAsset({
          file,
          userId: req.user.userId,
          projectId: projectResult.rows[0].id,
          index
        })
      )
    );

    const assetResult = await client.query(
      `UPDATE projects
       SET assets_url = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(storedAssets), projectResult.rows[0].id]
    );

    const project = assetResult.rows[0];
    const portfolioDraft = await generatePortfolioDraft(project);
    const publicSlug = `${slugify(title)}-${uuidv4().slice(0, 8)}`;

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
    if (client) {
      await client.query("ROLLBACK");
    }
    return res.status(500).json({ error: error.message });
  } finally {
    client?.release();
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
        `${slugify(project.title)}-${uuidv4().slice(0, 8)}`
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
      `${slugify(project.title)}-${uuidv4().slice(0, 8)}`;

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

router.put("/:projectId", async (req, res) => {
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

  try {
    const project = await getOwnedProject(req.params.projectId, req.user.userId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const result = await pool.query(
      `UPDATE projects
       SET title = COALESCE($1, title),
           client_name = COALESCE($2, client_name),
           category = COALESCE($3, category),
           industry = COALESCE($4, industry),
           timeline = COALESCE($5, timeline),
           source_url = COALESCE($6, source_url),
           challenge_text = COALESCE($7, challenge_text),
           solution_text = COALESCE($8, solution_text),
           results_text = COALESCE($9, results_text),
           deliverables = COALESCE($10, deliverables),
           testimonials = COALESCE($11, testimonials),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [
        title || null,
        client_name || null,
        category || null,
        industry || null,
        timeline || null,
        source_url || null,
        challenge || null,
        solution || null,
        results || null,
        deliverables ? JSON.stringify(parseJsonArray(deliverables)) : null,
        testimonials ? JSON.stringify(parseJsonArray(testimonials)) : null,
        project.id
      ]
    );

    return res.json({ project: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete("/:projectId", async (req, res) => {
  try {
    const project = await getOwnedProject(req.params.projectId, req.user.userId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    await pool.query("DELETE FROM projects WHERE id = $1", [project.id]);
    return res.json({ message: "Project deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
