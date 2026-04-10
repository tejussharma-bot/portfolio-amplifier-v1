const express = require("express");
const axios = require("axios");

const { getChannelCapability } = require("../config/channel-capabilities");
const { pool } = require("../database/config");
const { authenticateToken } = require("../middleware/auth");
const { analyzeProjectFit, generateChannelDraft, generateSocialContent, requestText } = require("../services/ai");
const { parseJsonField, parseStoredArray } = require("../utils/json");

const router = express.Router();

router.use(authenticateToken);

async function getOwnedProject(projectId, userId) {
  const result = await pool.query(
    `SELECT p.*,
            pf.id AS portfolio_id,
            pf.content_json,
            pf.updated_at AS portfolio_updated_at,
            pf.is_published,
            pf.public_slug
     FROM projects p
     LEFT JOIN portfolios pf ON pf.project_id = p.id
     WHERE p.id = $1 AND p.user_id = $2
     LIMIT 1`,
    [projectId, userId]
  );

  return result.rows[0];
}

async function getOwnedDraft(draftId, userId) {
  const result = await pool.query(
    `SELECT gc.*, p.user_id, p.title AS project_title, p.client_name, p.results_text,
            p.challenge_text, p.solution_text, p.deliverables, p.assets_url, p.source_url,
            p.category, p.industry, p.timeline, p.testimonials,
            pf.id AS portfolio_id,
            pf.content_json,
            pf.updated_at AS current_portfolio_updated_at
     FROM generated_content gc
     INNER JOIN projects p ON p.id = gc.project_id
     LEFT JOIN portfolios pf ON pf.project_id = p.id
     WHERE gc.id = $1 AND p.user_id = $2
     LIMIT 1`,
    [draftId, userId]
  );

  return result.rows[0];
}

function parseString(value) {
  return String(value || "").trim();
}

function normalizeList(value) {
  return parseStoredArray(value)
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (item && typeof item === "object") {
        if (typeof item.label === "string") {
          return item.label.trim();
        }

        if (typeof item.url === "string") {
          return item.url.trim();
        }
      }

      return String(item || "").trim();
    })
    .filter(Boolean);
}

function buildCaseStudySource(record) {
  const snapshot = parseJsonField(record?.portfolio_snapshot, {}) || {};
  const content = Object.keys(snapshot).length
    ? snapshot
    : parseJsonField(record?.content_json, {}) || {};
  const sourceDocument = parseJsonField(content.source_document, {}) || {};
  const preview = parseJsonField(content.preview_json, {}) || {};
  const deliverables =
    normalizeList(sourceDocument.deliverables).length
      ? normalizeList(sourceDocument.deliverables)
      : normalizeList(content.deliverables).length
        ? normalizeList(content.deliverables)
        : normalizeList(record?.deliverables);
  const proofPoints =
    normalizeList(sourceDocument.proof_points).length
      ? normalizeList(sourceDocument.proof_points)
      : normalizeList(content.proof_points).length
        ? normalizeList(content.proof_points)
        : normalizeList(record?.results_text);
  const assets =
    parseStoredArray(sourceDocument.assets_url).length
      ? parseStoredArray(sourceDocument.assets_url)
      : parseStoredArray(content.asset_sources).length
        ? parseStoredArray(content.asset_sources)
        : parseStoredArray(record?.assets_url);
  const tags =
    normalizeList(sourceDocument.tags).length
      ? normalizeList(sourceDocument.tags)
      : normalizeList(content.tags);
  const testimonials = normalizeList(record?.testimonials);
  const testimonial =
    parseString(sourceDocument.testimonial) ||
    parseString(content.testimonial) ||
    parseString(content.testimonial_prompt) ||
    parseString(testimonials[0]);

  return {
    title:
      parseString(sourceDocument.title) ||
      parseString(preview.title) ||
      parseString(record?.project_title) ||
      parseString(record?.title) ||
      "Untitled case study",
    client_name:
      parseString(sourceDocument.client_name) ||
      parseString(preview.client_name) ||
      parseString(record?.client_name),
    category:
      parseString(sourceDocument.category) ||
      parseString(preview.category) ||
      parseString(record?.category) ||
      "Case Study",
    industry:
      parseString(sourceDocument.industry) ||
      parseString(preview.industry) ||
      parseString(record?.industry),
    timeline:
      parseString(sourceDocument.timeline) ||
      parseString(preview.timeline) ||
      parseString(record?.timeline),
    source_url:
      parseString(sourceDocument.source_url) ||
      parseString(preview.source_url) ||
      parseString(record?.source_url),
    hero_summary:
      parseString(sourceDocument.hero_summary) ||
      parseString(preview.hero_summary) ||
      parseString(content.hero_summary),
    challenge_text:
      parseString(sourceDocument.challenge) ||
      parseString(preview.challenge) ||
      parseString(content.challenge) ||
      parseString(record?.challenge_text),
    solution_text:
      parseString(sourceDocument.solution) ||
      parseString(preview.solution) ||
      parseString(content.solution) ||
      parseString(record?.solution_text),
    results_text:
      parseString(sourceDocument.results) ||
      parseString(preview.results) ||
      parseString(content.results) ||
      parseString(record?.results_text),
    deliverables,
    proof_points: proofPoints,
    testimonial,
    tags,
    assets_url: assets,
    content_json: content,
    portfolio_id: record?.portfolio_id || null,
    portfolio_updated_at:
      record?.source_portfolio_updated_at ||
      record?.portfolio_updated_at ||
      record?.current_portfolio_updated_at ||
      null
  };
}

function buildPortfolioSnapshot(source) {
  const existing = parseJsonField(source.content_json, {}) || {};

  return {
    ...existing,
    source_document: {
      title: source.title,
      client_name: source.client_name,
      category: source.category,
      industry: source.industry,
      timeline: source.timeline,
      source_url: source.source_url,
      hero_summary: source.hero_summary,
      challenge: source.challenge_text,
      solution: source.solution_text,
      results: source.results_text,
      deliverables: source.deliverables,
      proof_points: source.proof_points,
      testimonial: source.testimonial,
      tags: source.tags,
      assets_url: source.assets_url
    }
  };
}

function buildDraftText(draftData) {
  const normalizedDraftData = parseJsonField(draftData, draftData) || {};

  return [
    normalizedDraftData?.headline || normalizedDraftData?.hook || "",
    normalizedDraftData?.body || normalizedDraftData?.caption || "",
    normalizedDraftData?.cta || ""
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join("\n\n");
}

function normalizeTags(draftData) {
  const normalizedDraftData = parseJsonField(draftData, draftData) || {};

  if (Array.isArray(normalizedDraftData?.tags)) {
    return normalizedDraftData.tags;
  }

  if (Array.isArray(normalizedDraftData?.hashtags)) {
    return normalizedDraftData.hashtags;
  }

  if (typeof normalizedDraftData?.tags === "string") {
    return normalizedDraftData.tags.split(",").map((item) => item.trim()).filter(Boolean);
  }

  if (typeof normalizedDraftData?.hashtags === "string") {
    return normalizedDraftData.hashtags.split(" ").filter(Boolean);
  }

  return [];
}

function buildExportPayload(draft, caseStudySource) {
  const draftData = parseJsonField(draft.draft_data, {}) || {};

  return {
    platform: draft.platform,
    title: draftData.headline || caseStudySource.title,
    body: buildDraftText(draftData),
    tags: normalizeTags(draftData),
    objective: draft.objective,
    tone: draft.tone,
    guidance: {
      recommendedFormat: draft.content_type,
      sourceUrl: caseStudySource.source_url,
      heroSummary: caseStudySource.hero_summary,
      results: caseStudySource.results_text,
      deliverables: caseStudySource.deliverables,
      proofPoints: caseStudySource.proof_points,
      testimonial: caseStudySource.testimonial,
      assetCount: parseStoredArray(caseStudySource.assets_url).length
    }
  };
}

async function publishToLinkedIn({ accessToken, personId, text }) {
  const capability = getChannelCapability("linkedin");
  const author = String(personId).startsWith("urn:li:person:")
    ? String(personId)
    : `urn:li:person:${personId}`;

  if (!author.startsWith("urn:li:person:")) {
    throw new Error("Invalid LinkedIn author identifier");
  }

  const response = await axios.post(
    `${capability.apiBaseUrl}/posts`,
    {
      author,
      commentary: text,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": capability.requiredHeaders["X-Restli-Protocol-Version"],
        [capability.apiVersionHeader.name]: capability.apiVersionHeader.value
      }
    }
  );

  return response.headers["x-restli-id"] || response.data?.id || null;
}

async function publishToGoogleMyBusiness({ accessToken, accountId, text }) {
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

    const analysis = await analyzeProjectFit(buildCaseStudySource(project), { objective, tone });
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
    contentType = "post",
    hookHint
  } = req.body;

  if (!projectId || !platform) {
    return res.status(400).json({ error: "projectId and platform are required" });
  }

  try {
    const project = await getOwnedProject(projectId, req.user.userId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const caseStudySource = buildCaseStudySource(project);
    const draft = await generateChannelDraft({
      project: caseStudySource,
      platform,
      tone,
      objective,
      hookHint
    });
    const portfolioSnapshot = buildPortfolioSnapshot(caseStudySource);

    const result = await pool.query(
      `INSERT INTO generated_content (
         project_id,
         objective,
         tone,
         platform,
         content_type,
         draft_data,
         status,
         portfolio_snapshot,
         source_portfolio_updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8)
       RETURNING *`,
      [
        project.id,
        objective,
        tone,
        platform,
        contentType,
        JSON.stringify(draft),
        JSON.stringify(portfolioSnapshot),
        caseStudySource.portfolio_updated_at
      ]
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

    const exportPayload = buildExportPayload(draft, buildCaseStudySource(draft));
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

      if (channel.token_expires_at && new Date(channel.token_expires_at) <= new Date()) {
        return res.status(401).json({
          error: "LinkedIn token has expired. Please reconnect your LinkedIn account.",
          mode: "token-expired"
        });
      }

      const metadata = parseJsonField(channel.metadata, {}) || {};
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

    const exportPayload = buildExportPayload(draft, buildCaseStudySource(draft));
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

    const content = await generateSocialContent(buildCaseStudySource(project), platform, tone);

    return res.json({ content });
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
