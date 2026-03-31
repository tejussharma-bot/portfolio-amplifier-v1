const express = require("express");

const { pool } = require("../database/config");
const { authenticateToken } = require("../middleware/auth");
const { analyzeProjectFit, generateChannelDraft } = require("../services/ai");

const router = express.Router();

router.use(authenticateToken);

async function getOwnedProject(projectId, userId) {
  const result = await pool.query(
    "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
    [projectId, userId]
  );

  return result.rows[0];
}

router.post("/:projectId/analyze", async (req, res) => {
  const { objective = "Get clients", tone = "Professional" } = req.body;

  try {
    const project = await getOwnedProject(req.params.projectId, req.user.userId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const analysis = await analyzeProjectFit(project, { objective, tone });
    const recommendedAngles = Object.entries(analysis).map(([platform, details]) => ({
      platform,
      angle: details.angle,
      cta: details.cta
    }));

    await pool.query(
      `INSERT INTO analysis_results (project_id, objective, tone, platform_scores, recommended_angles)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        project.id,
        objective,
        tone,
        JSON.stringify(analysis),
        JSON.stringify(recommendedAngles)
      ]
    );

    await pool.query(
      `UPDATE projects
       SET status = 'ready', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [project.id]
    );

    return res.json(analysis);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/generate-content", async (req, res) => {
  const {
    projectId,
    platform,
    tone = "Professional",
    objective = "Get clients",
    contentType = "post"
  } = req.body;

  if (!projectId || !platform) {
    return res.status(400).json({ error: "projectId and platform are required" });
  }

  try {
    const project = await getOwnedProject(projectId, req.user.userId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const draft = await generateChannelDraft({
      project,
      platform,
      tone,
      objective
    });

    const result = await pool.query(
      `INSERT INTO generated_content (
         project_id,
         objective,
         tone,
         platform,
         content_type,
         draft_data
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [project.id, objective, tone, platform, contentType, JSON.stringify(draft)]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/:projectId/drafts", async (req, res) => {
  try {
    const project = await getOwnedProject(req.params.projectId, req.user.userId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const result = await pool.query(
      `SELECT * FROM generated_content
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [project.id]
    );

    return res.json({ drafts: result.rows });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
