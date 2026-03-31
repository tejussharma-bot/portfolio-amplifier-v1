const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const { pool } = require("../database/config");
const { authenticateToken } = require("../middleware/auth");
const { hasConfiguredCredentials } = require("../utils/config");

const router = express.Router();

const setupGuides = {
  linkedin: {
    platform: "linkedin",
    title: "Share on LinkedIn",
    mode: "direct",
    steps: [
      "Create a LinkedIn app and enable Sign In with LinkedIn plus Share on LinkedIn.",
      "Set the redirect URI to your backend callback URL.",
      "Connect the account here, then publish text-first posts directly from Publish Studio."
    ],
    requirements: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "LINKEDIN_REDIRECT_URI"]
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
  }
};

function buildFrontendUrl(pathname = "/dashboard/channels", searchParams = {}) {
  const base = process.env.FRONTEND_URL || "http://localhost:3001";
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

function signOAuthState(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "10m" });
}

function verifyOAuthState(state) {
  return jwt.verify(state, process.env.JWT_SECRET);
}

function isPlatformConfigured(platform) {
  if (platform === "linkedin") {
    return hasConfiguredCredentials(
      process.env.LINKEDIN_CLIENT_ID,
      process.env.LINKEDIN_CLIENT_SECRET,
      process.env.LINKEDIN_REDIRECT_URI
    );
  }

  if (platform === "dribbble") {
    return hasConfiguredCredentials(
      process.env.DRIBBBLE_CLIENT_ID,
      process.env.DRIBBBLE_CLIENT_SECRET,
      process.env.DRIBBBLE_REDIRECT_URI
    );
  }

  return true;
}

async function upsertChannel({
  userId,
  platform,
  platformUserId = null,
  accessToken,
  refreshToken = null,
  expiresIn = null,
  metadata = {}
}) {
  const expiresAt = expiresIn
    ? new Date(Date.now() + Number(expiresIn) * 1000)
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

async function fetchLinkedInMemberId(accessToken) {
  try {
    const response = await axios.get("https://api.linkedin.com/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0"
      },
      params: {
        projection: "(id)"
      }
    });

    return response.data?.id ? String(response.data.id) : null;
  } catch (error) {
    return null;
  }
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

  if (!["linkedin", "dribbble"].includes(platform)) {
    return res.status(400).json({ error: "Unsupported platform" });
  }

  if (!isPlatformConfigured(platform)) {
    return res.status(400).json({
      error: `${platform} is not configured in environment variables`,
      setupGuide: setupGuides[platform]
    });
  }

  const state = signOAuthState({
    userId: req.user.userId,
    platform,
    returnTo: normalizeReturnTo(req.query.returnTo)
  });

  if (platform === "linkedin") {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.LINKEDIN_CLIENT_ID,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
      scope: "w_member_social r_liteprofile",
      state
    });

    return res.json({
      url: `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
    });
  }

  const params = new URLSearchParams({
    client_id: process.env.DRIBBBLE_CLIENT_ID,
    redirect_uri: process.env.DRIBBBLE_REDIRECT_URI,
    scope: "public upload",
    state
  });

  return res.json({
    url: `https://dribbble.com/oauth/authorize?${params.toString()}`
  });
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

  const state = signOAuthState({
    userId: req.user.userId,
    platform: "linkedin",
    returnTo: normalizeReturnTo(req.query.returnTo)
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
    scope: "w_member_social r_liteprofile",
    state
  });

  return res.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  );
});

router.get("/linkedin/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.redirect(
      buildFrontendUrl("/dashboard/channels", {
        oauth: "error",
        platform: "linkedin",
        message: error_description || error
      })
    );
  }

  if (!code || !state) {
    return res.redirect(
      buildFrontendUrl("/dashboard/channels", {
        oauth: "error",
        platform: "linkedin",
        message: "Missing OAuth code or state"
      })
    );
  }

  try {
    const decoded = verifyOAuthState(state);
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET
    });

    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      tokenParams.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const platformUserId = await fetchLinkedInMemberId(tokenResponse.data.access_token);

    await upsertChannel({
      userId: decoded.userId,
      platform: "linkedin",
      platformUserId,
      accessToken: tokenResponse.data.access_token,
      expiresIn: tokenResponse.data.expires_in,
      metadata: {
        scope: "w_member_social r_liteprofile"
      }
    });

    return res.redirect(
      buildFrontendUrl(decoded.returnTo || "/dashboard/channels", {
        oauth: "success",
        platform: "linkedin"
      })
    );
  } catch (error) {
    return res.redirect(
      buildFrontendUrl("/dashboard/channels", {
        oauth: "error",
        platform: "linkedin",
        message:
          error.response?.data?.error_description ||
          error.response?.data?.message ||
          "LinkedIn connection failed"
      })
    );
  }
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
    client_id: process.env.DRIBBBLE_CLIENT_ID,
    redirect_uri: process.env.DRIBBBLE_REDIRECT_URI,
    scope: "public upload",
    state
  });

  return res.redirect(`https://dribbble.com/oauth/authorize?${params.toString()}`);
});

router.get("/dribbble/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query;

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
      client_id: process.env.DRIBBBLE_CLIENT_ID,
      client_secret: process.env.DRIBBBLE_CLIENT_SECRET,
      code,
      redirect_uri: process.env.DRIBBBLE_REDIRECT_URI
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
      expiresIn: tokenResponse.data.expires_in || null
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

router.get("/behance/export-template", authenticateToken, (req, res) => {
  return res.json({
    message:
      "Behance publishing is export-first in V1 because new public API access is limited.",
    template: {
      title: "Project title",
      intro: "Paste the AI-generated overview and challenge framing here.",
      sections: [
        "Challenge",
        "Solution",
        "Deliverables",
        "Results",
        "Gallery"
      ],
      coverGuidance: "Lead with your strongest hero image and one quantified outcome."
    }
  });
});

router.delete("/:platform", authenticateToken, async (req, res) => {
  const { platform } = req.params;

  if (!["linkedin", "dribbble", "behance"].includes(platform)) {
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
