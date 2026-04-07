const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const { pool } = require("../database/config");
const { authenticateToken } = require("../middleware/auth");
const { cleanEnvValue, hasConfiguredCredentials } = require("../utils/config");

const router = express.Router();

const setupGuides = {
  linkedin: {
    platform: "linkedin",
    title: "Share on LinkedIn",
    mode: "direct",
    steps: [
      "Create a LinkedIn app and enable Sign In with LinkedIn using OpenID Connect.",
      "Set the redirect URI to your backend callback URL.",
      "Connect the account here for sign-in and identity linking. Direct publishing requires separate LinkedIn posting approval."
    ],
    requirements: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "LINKEDIN_AUTH_REDIRECT_URI"]
  },
  dribbble: {
    platform: "dribbble",
    title: "Dribbble",
    mode: "guided-upload",
    steps: [
      "Create a Dribbble developer application.",
      "Set the redirect URI to your backend callback URL.",
      "Connect the account here, then use the generated caption and asset recommendations for upload."
    ],
    requirements: ["DRIBBBLE_CLIENT_ID", "DRIBBBLE_CLIENT_SECRET", "DRIBBBLE_REDIRECT_URI"]
  },
  behance: {
    platform: "behance",
    title: "Behance",
    mode: "export",
    steps: [
      "Behance stays export-first in V1 because new public API access is limited.",
      "Use the generated case study copy, cover guidance, and section order from the export template.",
      "Publish manually inside Behance once your visuals and narrative are finalized."
    ],
    requirements: []
  },
  googlemybusiness: {
    platform: "googlemybusiness",
    title: "Google My Business",
    mode: "direct",
    steps: [
      "Create a Google Cloud Project and enable the Google My Business API.",
      "Set up OAuth 2.0 credentials and configure the redirect URI.",
      "Connect your Google My Business account for direct posting."
    ],
    requirements: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"]
  }
};

function buildFrontendUrl(pathname = "/dashboard/channels", searchParams = {}) {
  const base = cleanEnvValue(process.env.FRONTEND_URL) || "http://localhost:3001";
  const target = new URL(pathname, base);

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      target.searchParams.set(key, String(value));
    }
  });

  return target.toString();
}

function normalizeReturnTo(value) {
  const fallback = "/dashboard/channels";

  if (typeof value !== "string") {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

function encodeState(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function signOAuthState(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "10m" });
}

function verifyOAuthState(state) {
  return jwt.verify(state, process.env.JWT_SECRET);
}

async function upsertChannel({
  userId,
  platform,
  platformUserId,
  accessToken,
  refreshToken = null,
  expiresIn = null,
  metadata = {}
}) {
  const expiresAt =
    typeof expiresIn === "number" && Number.isFinite(expiresIn)
      ? new Date(Date.now() + expiresIn * 1000)
      : null;

  await pool.query(
    `INSERT INTO user_channels (
       user_id,
       platform,
       platform_user_id,
       access_token,
       refresh_token,
       token_expires_at,
       metadata,
       is_active
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
     ON CONFLICT (user_id, platform)
     DO UPDATE SET
       platform_user_id = EXCLUDED.platform_user_id,
       access_token = EXCLUDED.access_token,
       refresh_token = EXCLUDED.refresh_token,
       token_expires_at = EXCLUDED.token_expires_at,
       metadata = EXCLUDED.metadata,
       is_active = TRUE,
       updated_at = CURRENT_TIMESTAMP`,
    [
      userId,
      platform,
      platformUserId,
      accessToken,
      refreshToken,
      expiresAt,
      JSON.stringify(metadata)
    ]
  );
}

function isPlatformConfigured(platform) {
  if (platform === "linkedin") {
    const clientId = cleanEnvValue(process.env.LINKEDIN_CLIENT_ID);
    const clientSecret = cleanEnvValue(process.env.LINKEDIN_CLIENT_SECRET);
    const redirectUri =
      cleanEnvValue(process.env.LINKEDIN_AUTH_REDIRECT_URI) ||
      cleanEnvValue(process.env.LINKEDIN_REDIRECT_URI);

    return hasConfiguredCredentials(
      clientId,
      clientSecret,
      redirectUri
    );
  }

  if (platform === "dribbble") {
    const clientId = cleanEnvValue(process.env.DRIBBBLE_CLIENT_ID);
    const clientSecret = cleanEnvValue(process.env.DRIBBBLE_CLIENT_SECRET);
    const redirectUri = cleanEnvValue(process.env.DRIBBBLE_REDIRECT_URI);

    return hasConfiguredCredentials(
      clientId,
      clientSecret,
      redirectUri
    );
  }

  if (platform === "googlemybusiness") {
    const clientId = cleanEnvValue(process.env.GOOGLE_CLIENT_ID);
    const clientSecret = cleanEnvValue(process.env.GOOGLE_CLIENT_SECRET);
    const redirectUri = cleanEnvValue(process.env.GOOGLE_REDIRECT_URI);

    return hasConfiguredCredentials(
      clientId,
      clientSecret,
      redirectUri
    );
  }

  return true;
}

router.get("/status", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT platform, platform_user_id, token_expires_at, is_active, metadata, updated_at
       FROM user_channels
       WHERE user_id = $1
       ORDER BY platform`,
      [req.user.userId]
    );

    return res.json({
      channels: result.rows.map((row) => ({
        ...row,
        setup_mode: setupGuides[row.platform]?.mode || "direct",
        configured: isPlatformConfigured(row.platform)
      }))
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/:platform/connect-url", authenticateToken, async (req, res) => {
  const { platform } = req.params;

  if (!["linkedin", "dribbble", "googlemybusiness"].includes(platform)) {
    return res.status(400).json({ error: "Unsupported platform" });
  }

  if (!isPlatformConfigured(platform)) {
    return res.status(400).json({
      error: `${platform} is not configured in environment variables`,
      setupGuide: setupGuides[platform]
    });
  }

  const state =
    platform === "linkedin"
      ? encodeState({
          userId: req.user.userId,
          platform,
          mode: "channel-connect",
          returnTo: normalizeReturnTo(req.query.returnTo)
        })
      : signOAuthState({
          userId: req.user.userId,
          platform,
          mode: "channel-connect",
          returnTo: normalizeReturnTo(req.query.returnTo)
        });

  if (platform === "linkedin") {
    const clientId = cleanEnvValue(process.env.LINKEDIN_CLIENT_ID);
    const redirectUri =
      cleanEnvValue(process.env.LINKEDIN_AUTH_REDIRECT_URI) ||
      cleanEnvValue(process.env.LINKEDIN_REDIRECT_URI);
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "openid profile email w_member_social r_liteprofile",
      state
    });

    return res.json({
      url: `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
    });
  }

  if (platform === "dribbble") {
    const params = new URLSearchParams({
      client_id: cleanEnvValue(process.env.DRIBBBLE_CLIENT_ID),
      redirect_uri: cleanEnvValue(process.env.DRIBBBLE_REDIRECT_URI),
      scope: "public upload",
      state
    });

    return res.json({
      url: `https://dribbble.com/oauth/authorize?${params.toString()}`
    });
  }

  if (platform === "googlemybusiness") {
    const clientId = cleanEnvValue(process.env.GOOGLE_CLIENT_ID);
    const redirectUri = cleanEnvValue(process.env.GOOGLE_REDIRECT_URI);
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "https://www.googleapis.com/auth/business.manage",
      access_type: "offline",
      state
    });

    return res.json({
      url: `https://accounts.google.com/oauth/authorize?${params.toString()}`
    });
  }
});

router.get("/:platform/setup-guide", authenticateToken, (req, res) => {
  const guide = setupGuides[req.params.platform];

  if (!guide) {
    return res.status(404).json({ error: "Setup guide not found" });
  }

  return res.json({
    ...guide,
    configured: isPlatformConfigured(req.params.platform)
  });
});

router.get("/linkedin/connect", authenticateToken, (req, res) => {
  if (!isPlatformConfigured("linkedin")) {
    return res.status(400).json({ error: "LinkedIn is not configured in environment variables" });
  }

  const state = encodeState({
    userId: req.user.userId,
    platform: "linkedin",
    mode: "channel-connect",
    returnTo: normalizeReturnTo(req.query.returnTo)
  });

  const clientId = cleanEnvValue(process.env.LINKEDIN_CLIENT_ID);
  const redirectUri =
    cleanEnvValue(process.env.LINKEDIN_AUTH_REDIRECT_URI) ||
    cleanEnvValue(process.env.LINKEDIN_REDIRECT_URI);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid profile email w_member_social r_liteprofile",
    state
  });

  return res.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  );
});

router.get("/dribbble/connect", authenticateToken, (req, res) => {
  if (!isPlatformConfigured("dribbble")) {
    return res.status(400).json({ error: "Dribbble is not configured in environment variables" });
  }

  const state = signOAuthState({
    userId: req.user.userId,
    platform: "dribbble",
    returnTo: normalizeReturnTo(req.query.returnTo)
  });

  const params = new URLSearchParams({
    client_id: cleanEnvValue(process.env.DRIBBBLE_CLIENT_ID),
    redirect_uri: cleanEnvValue(process.env.DRIBBBLE_REDIRECT_URI),
    scope: "public upload",
    state
  });

  return res.redirect(`https://dribbble.com/oauth/authorize?${params.toString()}`);
});

router.get("/dribbble/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query;
  const clientId = cleanEnvValue(process.env.DRIBBBLE_CLIENT_ID);
  const clientSecret = cleanEnvValue(process.env.DRIBBBLE_CLIENT_SECRET);
  const redirectUri = cleanEnvValue(process.env.DRIBBBLE_REDIRECT_URI);

  if (error) {
    return res.redirect(
      buildFrontendUrl("/dashboard/channels", {
        oauth: "error",
        platform: "dribbble",
        message: error_description || error
      })
    );
  }

  if (!code || !state) {
    return res.redirect(
      buildFrontendUrl("/dashboard/channels", {
        oauth: "error",
        platform: "dribbble",
        message: "Missing OAuth code or state"
      })
    );
  }

  try {
    const decoded = verifyOAuthState(state);
    const tokenResponse = await axios.post("https://dribbble.com/oauth/token", {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri
    });

    let platformUserId = null;

    try {
      const profileResponse = await axios.get("https://api.dribbble.com/v2/user", {
        headers: {
          Authorization: `Bearer ${tokenResponse.data.access_token}`
        }
      });
      platformUserId = String(profileResponse.data.id);
    } catch (profileError) {
      platformUserId = null;
    }

    await upsertChannel({
      userId: decoded.userId,
      platform: "dribbble",
      platformUserId,
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token || null,
      expiresIn: tokenResponse.data.expires_in || null,
      metadata: {
        scope: "public upload"
      }
    });

    return res.redirect(
      buildFrontendUrl(decoded.returnTo || "/dashboard/channels", {
        oauth: "success",
        platform: "dribbble"
      })
    );
  } catch (error) {
    return res.redirect(
      buildFrontendUrl("/dashboard/channels", {
        oauth: "error",
        platform: "dribbble",
        message:
          error.response?.data?.error_description ||
          error.response?.data?.message ||
          "Dribbble connection failed"
      })
    );
  }
});

router.get("/googlemybusiness/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query;
  const clientId = cleanEnvValue(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = cleanEnvValue(process.env.GOOGLE_CLIENT_SECRET);
  const redirectUri = cleanEnvValue(process.env.GOOGLE_REDIRECT_URI);

  if (error) {
    return res.redirect(
      buildFrontendUrl("/dashboard/channels", {
        oauth: "error",
        platform: "googlemybusiness",
        message: error_description || error
      })
    );
  }

  if (!code || !state) {
    return res.redirect(
      buildFrontendUrl("/dashboard/channels", {
        oauth: "error",
        platform: "googlemybusiness",
        message: "Missing OAuth code or state"
      })
    );
  }

  try {
    const decoded = verifyOAuthState(state);
    const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri
    });

    let platformUserId = null;
    let businessInfo = null;

    try {
      const businessResponse = await axios.get(
        "https://mybusinessbusinessinformation.googleapis.com/v1/accounts",
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.data.access_token}`
          }
        }
      );

      if (businessResponse.data.accounts && businessResponse.data.accounts.length > 0) {
        platformUserId = businessResponse.data.accounts[0].name;
        businessInfo = businessResponse.data.accounts[0];
      }
    } catch (businessError) {
      platformUserId = null;
    }

    await upsertChannel({
      userId: decoded.userId,
      platform: "googlemybusiness",
      platformUserId,
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token || null,
      expiresIn: tokenResponse.data.expires_in || null,
      metadata: {
        scope: "https://www.googleapis.com/auth/business.manage",
        businessInfo
      }
    });

    return res.redirect(
      buildFrontendUrl(decoded.returnTo || "/dashboard/channels", {
        oauth: "success",
        platform: "googlemybusiness"
      })
    );
  } catch (error) {
    return res.redirect(
      buildFrontendUrl("/dashboard/channels", {
        oauth: "error",
        platform: "googlemybusiness",
        message:
          error.response?.data?.error_description ||
          error.response?.data?.message ||
          "Google My Business connection failed"
      })
    );
  }
});

router.get("/behance/export-template", authenticateToken, async (req, res) => {
  const { projectId } = req.query;

  try {
    let behanceTemplate;

    if (projectId) {
      // Get project data and generate specific template
      const projectResult = await pool.query(
        "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
        [projectId, req.user.userId]
      );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }

      const project = projectResult.rows[0];

      behanceTemplate = {
        title: project.title,
        intro: project.challenge_text ?
          `Challenge: ${project.challenge_text.substring(0, 200)}${project.challenge_text.length > 200 ? '...' : ''}` :
          "A comprehensive case study showcasing the project journey from concept to completion.",
        sections: [
          {
            title: "Challenge",
            content: project.challenge_text || "The project began with understanding the core business objectives and user needs."
          },
          {
            title: "Solution",
            content: project.solution_text || "We developed a strategic approach that addressed the key challenges while delivering measurable results."
          },
          {
            title: "Deliverables",
            content: Array.isArray(project.deliverables) ?
              project.deliverables.join(", ") :
              (project.deliverables || "Complete project deliverables including design files, documentation, and implementation assets.")
          },
          {
            title: "Results",
            content: project.results_text || "The project delivered successful outcomes that met or exceeded the established goals."
          },
          {
            title: "Gallery",
            content: project.assets_url ?
              `Project assets available at: ${project.assets_url}` :
              "Visual gallery showcasing key deliverables and project outcomes."
          }
        ],
        coverGuidance: "Lead with your strongest hero image and one quantified outcome.",
        tags: ["portfolio", "case study", "design", "development", project.title.toLowerCase().replace(/\s+/g, '')],
        sourceUrl: project.source_url || null
      };
    } else {
      // Generate generic template
      behanceTemplate = {
        title: "Portfolio Project Title",
        intro: "A comprehensive case study showcasing the project journey from concept to completion.",
        sections: [
          {
            title: "Challenge",
            content: "Describe the business problem, user needs, or technical challenge that initiated this project."
          },
          {
            title: "Solution",
            content: "Explain your approach, methodology, and the strategic thinking behind your solution."
          },
          {
            title: "Deliverables",
            content: "List the key outputs, features, designs, or products delivered as part of this project."
          },
          {
            title: "Results",
            content: "Share the outcomes, metrics, impact, and success indicators achieved through this work."
          },
          {
            title: "Gallery",
            content: "Visual showcase of the project work, process screenshots, and final deliverables."
          }
        ],
        coverGuidance: "Lead with your strongest hero image and one quantified outcome.",
        tags: ["portfolio", "case study", "design", "development"],
        sourceUrl: null
      };
    }

    return res.json({
      message: "Behance export template generated successfully",
      template: behanceTemplate
    });

  } catch (error) {
    console.error("Error generating Behance template:", error);
    return res.status(500).json({ error: "Failed to generate Behance export template" });
  }
});

router.delete("/:platform", authenticateToken, async (req, res) => {
  const { platform } = req.params;

  if (!["linkedin", "dribbble", "behance", "googlemybusiness"].includes(platform)) {
    return res.status(400).json({ error: "Unsupported platform" });
  }

  try {
    await pool.query(
      `UPDATE user_channels
       SET is_active = FALSE,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND platform = $2`,
      [req.user.userId, platform]
    );

    return res.json({ message: `${platform} disconnected` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
