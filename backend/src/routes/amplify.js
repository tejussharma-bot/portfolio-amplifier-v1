const express = require("express");
const axios = require("axios");

const { pool } = require("../database/config");
const { authenticateToken } = require("../middleware/auth");
const { analyzeProjectFit, generateChannelDraft, generateImagePrompt, generateSocialContent, requestText } = require("../services/ai");

const router = express.Router();

router.use(authenticateToken);

async function getOwnedProject(projectId, userId) {
  const result = await pool.query(
    "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
    [projectId, userId]
  );

  return result.rows[0];
}

async function getOwnedDraft(draftId, userId) {
  const result = await pool.query(
    `SELECT gc.*, p.user_id, p.title AS project_title, p.client_name, p.results_text,
            p.challenge_text, p.solution_text, p.deliverables, p.assets_url, p.source_url
     FROM generated_content gc
     INNER JOIN projects p ON p.id = gc.project_id
     WHERE gc.id = $1 AND p.user_id = $2
     LIMIT 1`,
    [draftId, userId]
  );

  return result.rows[0];
}

function buildDraftText(draftData) {
  return [
    draftData?.headline || draftData?.hook || "",
    draftData?.body || draftData?.caption || "",
    draftData?.cta || ""
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join("\n\n");
}

function normalizeTags(draftData) {
  if (Array.isArray(draftData?.tags)) {
    return draftData.tags;
  }

  if (Array.isArray(draftData?.hashtags)) {
    return draftData.hashtags;
  }

  if (typeof draftData?.tags === "string") {
    return draftData.tags.split(",").map((item) => item.trim()).filter(Boolean);
  }

  if (typeof draftData?.hashtags === "string") {
    return draftData.hashtags.split(" ").filter(Boolean);
  }

  return [];
}

function buildExportPayload(draft, project) {
  const draftData = draft.draft_data || {};

  return {
    platform: draft.platform,
    title: draftData.headline || project.project_title,
    body: buildDraftText(draftData),
    tags: normalizeTags(draftData),
    objective: draft.objective,
    tone: draft.tone,
    guidance: {
      recommendedFormat: draft.content_type,
      sourceUrl: project.source_url,
      results: project.results_text,
      deliverables: project.deliverables || [],
      assetCount: Array.isArray(project.assets_url) ? project.assets_url.length : 0
    }
  };
}

async function publishToLinkedIn({ accessToken, personId, text }) {
  const author = String(personId).startsWith("urn:li:person:")
    ? String(personId)
    : `urn:li:person:${personId}`;

  if (!author.startsWith("urn:li:person:")) {
    throw new Error("Invalid LinkedIn author identifier");
  }

  const response = await axios.post(
    "https://api.linkedin.com/v2/ugcPosts",
    {
      author,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text
          },
          shareMediaCategory: "NONE"
        }
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
      }
    }
  );

  return response.headers["x-restli-id"] || response.data?.id || null;
}

async function publishToGoogleMyBusiness({ accessToken, accountId, text }) {
  // First get the business locations
  const locationsResponse = await axios.get(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      params: {
        pageSize: 1
      }
    }
  );

  if (!locationsResponse.data.locations || locationsResponse.data.locations.length === 0) {
    throw new Error("No business locations found for this account");
  }

  const locationId = locationsResponse.data.locations[0].name;

  // Create a post
  const postResponse = await axios.post(
    `https://mybusiness.googleapis.com/v4/${locationId}/localPosts`,
    {
      languageCode: "en-US",
      summary: text.length > 1500 ? text.substring(0, 1500) + "..." : text,
      callToAction: {
        actionType: "LEARN_MORE",
        url: "https://portfolio-amplifier-v1.vercel.app"
      },
      topicType: "STANDARD"
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    }
  );

  return postResponse.data.name || null;
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

router.get("/drafts/:draftId", async (req, res) => {
  try {
    const draft = await getOwnedDraft(req.params.draftId, req.user.userId);

    if (!draft) {
      return res.status(404).json({ error: "Draft not found" });
    }

    return res.json({ draft });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.put("/drafts/:draftId", async (req, res) => {
  const { draftData, tone, objective, contentType } = req.body;

  try {
    const draft = await getOwnedDraft(req.params.draftId, req.user.userId);

    if (!draft) {
      return res.status(404).json({ error: "Draft not found" });
    }

    const result = await pool.query(
      `UPDATE generated_content
       SET draft_data = COALESCE($1, draft_data),
           tone = COALESCE($2, tone),
           objective = COALESCE($3, objective),
           content_type = COALESCE($4, content_type)
       WHERE id = $5
       RETURNING *`,
      [
        draftData ? JSON.stringify(draftData) : null,
        tone || null,
        objective || null,
        contentType || null,
        draft.id
      ]
    );

    return res.json({ draft: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/drafts/:draftId/schedule", async (req, res) => {
  const { scheduledFor } = req.body;
  const scheduledDate = new Date(scheduledFor);

  if (!scheduledFor || Number.isNaN(scheduledDate.getTime())) {
    return res.status(400).json({ error: "scheduledFor must be a valid datetime" });
  }

  try {
    const draft = await getOwnedDraft(req.params.draftId, req.user.userId);

    if (!draft) {
      return res.status(404).json({ error: "Draft not found" });
    }

    const result = await pool.query(
      `UPDATE generated_content
       SET status = 'scheduled',
           scheduled_for = $1
       WHERE id = $2
       RETURNING *`,
      [scheduledDate.toISOString(), draft.id]
    );

    return res.json({
      message: "Draft scheduled",
      draft: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/drafts/:draftId/export", async (req, res) => {
  try {
    const draft = await getOwnedDraft(req.params.draftId, req.user.userId);

    if (!draft) {
      return res.status(404).json({ error: "Draft not found" });
    }

    const exportPayload = buildExportPayload(draft, draft);
    const result = await pool.query(
      `UPDATE generated_content
       SET export_payload = $1,
           exported_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(exportPayload), draft.id]
    );

    return res.json({
      mode: draft.platform === "behance" ? "export" : "guided-upload",
      draft: result.rows[0],
      exportPayload
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/drafts/:draftId/publish", async (req, res) => {
  try {
    const draft = await getOwnedDraft(req.params.draftId, req.user.userId);

    if (!draft) {
      return res.status(404).json({ error: "Draft not found" });
    }

    if (draft.platform === "linkedin") {
      const channelResult = await pool.query(
        `SELECT platform_user_id, access_token, token_expires_at, is_active, metadata
         FROM user_channels
         WHERE user_id = $1 AND platform = 'linkedin'
         LIMIT 1`,
        [req.user.userId]
      );

      const channel = channelResult.rows[0];

      if (!channel?.is_active || !channel.access_token || !channel.platform_user_id) {
        return res.status(409).json({
          error: "LinkedIn must be connected before direct publishing",
          mode: "connect-required"
        });
      }

      // Check if token is expired
      if (channel.token_expires_at && new Date(channel.token_expires_at) <= new Date()) {
        return res.status(401).json({
          error: "LinkedIn token has expired. Please reconnect your LinkedIn account.",
          mode: "token-expired"
        });
      }

      const metadata =
        channel.metadata && typeof channel.metadata === "object"
          ? channel.metadata
          : {};
      const scope = String(metadata.scope || "").trim();
      const canPublish =
        metadata.canPublish === true ||
        scope.split(/\s+/).includes("w_member_social");

      if (!canPublish) {
        return res.status(409).json({
          error:
            "LinkedIn is connected for sign-in only. Direct publishing needs LinkedIn posting approval and a posting-enabled token.",
          mode: "permissions-required"
        });
      }

      const externalPostId = await publishToLinkedIn({
        accessToken: channel.access_token,
        personId: channel.platform_user_id,
        text: buildDraftText(draft.draft_data || {})
      });

      const result = await pool.query(
        `UPDATE generated_content
         SET status = 'published',
             published_at = CURRENT_TIMESTAMP,
             external_post_id = $1
         WHERE id = $2
         RETURNING *`,
        [externalPostId, draft.id]
      );

      return res.json({
        mode: "direct",
        message: "Published to LinkedIn",
        draft: result.rows[0],
        externalPostId
      });
    }

    if (draft.platform === "googlemybusiness") {
      const channelResult = await pool.query(
        `SELECT platform_user_id, access_token, token_expires_at, is_active, metadata
         FROM user_channels
         WHERE user_id = $1 AND platform = 'googlemybusiness'
         LIMIT 1`,
        [req.user.userId]
      );

      const channel = channelResult.rows[0];

      if (!channel?.is_active || !channel.access_token || !channel.platform_user_id) {
        return res.status(409).json({
          error: "Google My Business must be connected before direct publishing",
          mode: "connect-required"
        });
      }

      // Check if token is expired
      if (channel.token_expires_at && new Date(channel.token_expires_at) <= new Date()) {
        return res.status(401).json({
          error: "Google My Business token has expired. Please reconnect your account.",
          mode: "token-expired"
        });
      }

      const externalPostId = await publishToGoogleMyBusiness({
        accessToken: channel.access_token,
        accountId: channel.platform_user_id,
        text: buildDraftText(draft.draft_data || {})
      });

      const result = await pool.query(
        `UPDATE generated_content
         SET status = 'published',
             published_at = CURRENT_TIMESTAMP,
             external_post_id = $1
         WHERE id = $2
         RETURNING *`,
        [externalPostId, draft.id]
      );

      return res.json({
        mode: "direct",
        message: "Published to Google My Business",
        draft: result.rows[0],
        externalPostId
      });
    }

    const exportPayload = buildExportPayload(draft, draft);
    const result = await pool.query(
      `UPDATE generated_content
       SET export_payload = $1,
           exported_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(exportPayload), draft.id]
    );

    return res.json({
      mode: draft.platform === "behance" ? "export" : "guided-upload",
      message:
        draft.platform === "behance"
          ? "Behance stays export-first in V1"
          : "Dribbble uses guided upload in V1",
      draft: result.rows[0],
      exportPayload
    });
  } catch (error) {
    const providerMessage =
      error.response?.data?.message ||
      error.response?.data?.error_description ||
      error.response?.data?.error ||
      error.message;

    return res.status(502).json({
      error: `Publish failed: ${providerMessage}`
    });
  }
});

router.post("/generate-social-content", async (req, res) => {
  const { projectId, platform, tone = "professional" } = req.body;

  if (!projectId || !platform) {
    return res.status(400).json({ error: "projectId and platform are required" });
  }

  try {
    const project = await getOwnedProject(projectId, req.user.userId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const content = await generateSocialContent(project, platform, tone);

    return res.json({ content });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/generate-image-prompt", async (req, res) => {
  const { projectId, style = "professional" } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required" });
  }

  try {
    const project = await getOwnedProject(projectId, req.user.userId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const prompt = await generateImagePrompt(project, style);

    return res.json({ prompt });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/generate-text", async (req, res) => {
  const { systemPrompt, userPrompt, options = {} } = req.body;

  if (!systemPrompt || !userPrompt) {
    return res.status(400).json({ error: "systemPrompt and userPrompt are required" });
  }

  try {
    const text = await requestText(systemPrompt, userPrompt, options);

    return res.json({ text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
