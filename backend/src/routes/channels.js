const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const { pool } = require("../database/config");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

function signOAuthState(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "10m" });
}

function verifyOAuthState(state) {
  return jwt.verify(state, process.env.JWT_SECRET);
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

router.get("/status", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT platform, platform_user_id, token_expires_at, is_active, metadata
       FROM user_channels
       WHERE user_id = $1
       ORDER BY platform`,
      [req.user.userId]
    );

    return res.json({ channels: result.rows });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/:platform/connect-url", authenticateToken, async (req, res) => {
  const { platform } = req.params;

  if (!["linkedin", "dribbble"].includes(platform)) {
    return res.status(400).json({ error: "Unsupported platform" });
  }

  const state = signOAuthState({
    userId: req.user.userId,
    platform
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

router.get("/linkedin/connect", authenticateToken, (req, res) => {
  const state = signOAuthState({
    userId: req.user.userId,
    platform: "linkedin"
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
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send("Missing OAuth code or state");
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

    await upsertChannel({
      userId: decoded.userId,
      platform: "linkedin",
      accessToken: tokenResponse.data.access_token,
      expiresIn: tokenResponse.data.expires_in,
      metadata: {
        scope: "w_member_social r_liteprofile"
      }
    });

    return res.send("LinkedIn connected successfully. You can close this window.");
  } catch (error) {
    return res.status(500).send("LinkedIn connection failed");
  }
});

router.get("/dribbble/connect", authenticateToken, (req, res) => {
  const state = signOAuthState({
    userId: req.user.userId,
    platform: "dribbble"
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
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send("Missing OAuth code or state");
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

    return res.send("Dribbble connected successfully. You can close this window.");
  } catch (error) {
    return res.status(500).send("Dribbble connection failed");
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

module.exports = router;
