const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const { pool } = require("../database/config");
const { authenticateToken } = require("../middleware/auth");
const {
  buildProjectOutputs,
  createProjectBuildStatus,
  markProjectBuildFailed,
  updateProjectBuildState
} = require("../services/project-builder");
const { storeProjectAsset } = require("../services/storage");
const { parseJsonField, parseStoredArray } = require("../utils/json");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 10
  }
});
const router = express.Router();

function parseProjectRequest(req, res, next) {
  if (req.is("multipart/form-data")) {
    return upload.array("assets", 10)(req, res, next);
  }

  return next();
}

function parseJsonArray(value) {
  return parseStoredArray(value);
}

function normalizeAssetReferences(value) {
  return parseStoredArray(value).map((entry) => {
    if (typeof entry === "string") {
      return {
        sourceType: "url",
        url: entry
      };
    }

    return {
      sourceType: entry.sourceType || "url",
      ...entry
    };
  });
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

async function savePortfolioDraft(project, portfolioDraft) {
  const publicSlug =
    project.public_slug || `${slugify(project.title)}-${uuidv4().slice(0, 8)}`;

  await pool.query(
    `INSERT INTO portfolios (project_id, content_json, public_slug)
     VALUES ($1, $2, $3)
     ON CONFLICT (project_id)
     DO UPDATE SET
       content_json = EXCLUDED.content_json,
       public_slug = COALESCE(portfolios.public_slug, EXCLUDED.public_slug),
       updated_at = CURRENT_TIMESTAMP`,
    [project.id, JSON.stringify(portfolioDraft), publicSlug]
  );

  return publicSlug;
}

async function saveProjectAnalysis(projectId, objective, tone, analysis, recommendedAngles) {
  await pool.query(
    `INSERT INTO analysis_results (project_id, objective, tone, platform_scores, recommended_angles)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      projectId,
      objective,
      tone,
      JSON.stringify(analysis),
      JSON.stringify(recommendedAngles)
    ]
  );
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

router.get("/:projectId/build-status", async (req, res) => {
  try {
    const project = await getOwnedProject(req.params.projectId, req.user.userId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.json({
      project,
      buildStatus: createProjectBuildStatus(project)
    });
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
      analysis: latestAnalysis.rows[0] || null,
      buildStatus: createProjectBuildStatus(project)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/", parseProjectRequest, async (req, res) => {
  const {
    title,
    client_name,
    category,
    industry,
    timeline,
    source_url,
    assets_url,
    asset_urls,
    asset_references,
    challenge,
    solution,
    results,
    deliverables,
    testimonials,
    tags,
    conversation_messages,
    theme_id
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Project title is required" });
  }

  let project = null;

  try {
    const created = await pool.query(
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
         testimonials,
         build_stage,
         build_progress,
         build_started_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'structuring', $8, $9, $10, $11, '[]'::jsonb, $12, 'intake_captured', 12, CURRENT_TIMESTAMP)
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

    project = created.rows[0];

    const uploadedAssets = await Promise.all(
      (req.files || []).map((file, index) =>
        storeProjectAsset({
          file,
          userId: req.user.userId,
          projectId: project.id,
          index
        })
      )
    );
    const linkedAssets = normalizeAssetReferences(
      asset_references || asset_urls || assets_url
    );
    const storedAssets = [
      ...uploadedAssets.map((asset) => ({
        sourceType: "uploaded",
        ...asset
      })),
      ...linkedAssets
    ];

    if (storedAssets.length) {
      const assetResult = await pool.query(
        `UPDATE projects
         SET assets_url = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [JSON.stringify(storedAssets), project.id]
      );

      project = assetResult.rows[0];
    }

    project = await updateProjectBuildState(pool, project.id, "assets_uploaded", {
      status: "structuring"
    });
    project = await updateProjectBuildState(pool, project.id, "story_structuring", {
      status: "structuring"
    });

    const sourceProject = await getOwnedProject(project.id, req.user.userId);
    const { portfolioDraft, analysis, objective, tone, recommendedAngles } =
      await buildProjectOutputs(sourceProject);
    const serializedConversation = parseStoredArray(conversation_messages);
    const themeId = String(theme_id || "luxury").trim() || "luxury";
    const existingPortfolioContent = parseJsonField(sourceProject?.content_json, {}) || {};
    const enrichedPortfolioDraft = {
      ...portfolioDraft,
      theme_id: themeId,
      tags: parseStoredArray(tags),
      conversation_messages: serializedConversation,
      asset_sources: storedAssets,
      preview_json: {
        title: project.title,
        client_name: project.client_name,
        category: project.category,
        tags: parseStoredArray(tags),
        challenge: portfolioDraft.challenge,
        solution: portfolioDraft.solution,
        results: portfolioDraft.results,
        deliverables: portfolioDraft.deliverables,
        proof_points: portfolioDraft.proof_points,
        testimonial:
          parseStoredArray(project.testimonials)[0] || portfolioDraft.testimonial_prompt
      },
      publish_readiness: project.status === "ready" ? "ready" : "draft",
      export_history: existingPortfolioContent.export_history || []
    };

    project = await updateProjectBuildState(pool, project.id, "portfolio_composed", {
      status: "structuring"
    });

    await savePortfolioDraft(sourceProject, enrichedPortfolioDraft);

    project = await updateProjectBuildState(pool, project.id, "platform_analysis", {
      status: "structuring"
    });

    await saveProjectAnalysis(project.id, objective, tone, analysis, recommendedAngles);

    project = await updateProjectBuildState(pool, project.id, "ready_for_review", {
      status: "ready",
      completed: true
    });

    return res.status(201).json({
      project,
      portfolioDraft: enrichedPortfolioDraft,
      analysis,
      buildStatus: createProjectBuildStatus(project)
    });
  } catch (error) {
    if (project?.id) {
      try {
        project = await markProjectBuildFailed(pool, project.id, error);
      } catch (updateError) {
        console.error("Unable to mark project build failure", updateError);
      }
    }

    return res.status(500).json({
      error: error.message,
      buildStatus: project ? createProjectBuildStatus(project) : null
    });
  }
});

router.post("/:projectId/generate-portfolio", async (req, res) => {
  try {
    const project = await getOwnedProject(req.params.projectId, req.user.userId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    let updatedProject = await updateProjectBuildState(pool, project.id, "story_structuring", {
      status: "structuring",
      completed: false
    });

    const sourceProject = await getOwnedProject(project.id, req.user.userId);
    const { portfolioDraft, analysis, objective, tone, recommendedAngles } =
      await buildProjectOutputs(sourceProject);
    const existingPortfolioContent = parseJsonField(sourceProject?.content_json, {}) || {};
    const preservedTags = parseStoredArray(existingPortfolioContent.tags);
    const preservedConversation = parseStoredArray(existingPortfolioContent.conversation_messages);
    const preservedAssets = parseStoredArray(existingPortfolioContent.asset_sources || sourceProject.assets_url);
    const enrichedPortfolioDraft = {
      ...portfolioDraft,
      theme_id: String(existingPortfolioContent.theme_id || "luxury"),
      tags: preservedTags,
      conversation_messages: preservedConversation,
      asset_sources: preservedAssets,
      preview_json: {
        title: sourceProject.title,
        client_name: sourceProject.client_name,
        category: sourceProject.category,
        tags: preservedTags,
        challenge: portfolioDraft.challenge,
        solution: portfolioDraft.solution,
        results: portfolioDraft.results,
        deliverables: portfolioDraft.deliverables,
        proof_points: portfolioDraft.proof_points,
        testimonial:
          parseStoredArray(sourceProject.testimonials)[0] || portfolioDraft.testimonial_prompt
      },
      publish_readiness: existingPortfolioContent.publish_readiness || "draft",
      export_history: existingPortfolioContent.export_history || []
    };

    updatedProject = await updateProjectBuildState(pool, project.id, "portfolio_composed", {
      status: "structuring"
    });

    await savePortfolioDraft(sourceProject, enrichedPortfolioDraft);

    updatedProject = await updateProjectBuildState(pool, project.id, "platform_analysis", {
      status: "structuring"
    });

    await saveProjectAnalysis(project.id, objective, tone, analysis, recommendedAngles);

    updatedProject = await updateProjectBuildState(pool, project.id, "ready_for_review", {
      status: "ready",
      completed: true
    });

    return res.json({
      portfolioDraft: enrichedPortfolioDraft,
      analysis,
      buildStatus: createProjectBuildStatus(updatedProject)
    });
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
      project.public_slug || `${slugify(project.title)}-${uuidv4().slice(0, 8)}`;

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
       SET status = $1,
           build_stage = 'ready_for_review',
           build_progress = 100,
           build_completed_at = COALESCE(build_completed_at, CURRENT_TIMESTAMP),
           last_build_error = NULL,
           updated_at = CURRENT_TIMESTAMP
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
