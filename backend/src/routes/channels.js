const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const { getChannelCapability } = require("../config/channel-capabilities");
const { pool } = require("../database/config");
const { authenticateToken, signToken } = require("../middleware/auth");
const { cleanEnvValue, hasConfiguredCredentials } = require("../utils/config");
const { parseJsonField, parseStoredArray } = require("../utils/json");
const {
  buildFrontendTokenRedirect,
  buildFrontendUrl,
  buildOAuthRedirectUri
} = require("../utils/url-helpers");

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
    requirements: [
      "LINKEDIN_CLIENT_ID",
      "LINKEDIN_CLIENT_SECRET",
      "LINKEDIN_AUTH_REDIRECT_URI or LINKEDIN_REDIRECT_URI"
    ]
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
    title: "Google Business",
    mode: "direct",
    steps: [
      "Create a Google Cloud Project and enable the Google My Business API.",
      "Set up OAuth 2.0 credentials and configure the redirect URI.",
      "Connect your Google My Business account for direct posting."
    ],
    requirements: [
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_CHANNEL_REDIRECT_URI"
    ]
  }
};

function parseScopeList(value) {
  return String(value || "")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isExpired(value) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date <= new Date();
}

function getSetupGuide(platform) {
  const capability = getChannelCapability(platform);
  const fallback = setupGuides[platform] || null;

  if (!capability) {
    return fallback;
  }

  return {
    ...(fallback || {}),
    platform,
    title: fallback?.title || capability.label,
    mode: capability.productMode,
    requirements: capability.envVars,
    supportedActions: capability.supportedActions,
    unsupportedActions: capability.unsupportedActions,
    fallbackBehavior: capability.fallbackBehavior
  };
}

function buildChannelCapabilityState(platform, row) {
  const capability = getChannelCapability(platform);
  const metadata = parseJsonField(row?.metadata, {}) || {};
  const scopes = parseScopeList(metadata.scope);
  const connected = Boolean(row?.is_active && row?.access_token);
  const expired = isExpired(row?.token_expires_at);
  let canPublish = false;

  if (platform === "linkedin") {
    canPublish =
      connected &&
      !expired &&
      Boolean(row?.platform_user_id) &&
      (metadata.canPublish === true || scopes.includes("w_member_social"));
  } else if (platform === "googlemybusiness") {
    canPublish =
      connected &&
      !expired &&
      Boolean(row?.platform_user_id) &&
      scopes.includes("https://www.googleapis.com/auth/business.manage");
  } else if (platform === "dribbble") {
    canPublish =
      capability?.productMode === "direct" &&
      connected &&
      !expired &&
      Boolean(row?.platform_user_id) &&
      scopes.includes("upload");
  }

  let capabilityState = "Not connected";

  if (capability?.productMode === "export") {
    capabilityState = "Export only";
  } else if (expired) {
    capabilityState = "Needs reconnect";
  } else if (canPublish) {
    capabilityState = "Connected - publish capable";
  } else if (connected) {
    capabilityState =
      capability?.productMode === "guided-upload"
        ? "Connected - sign-in only"
        : "Connected - sign-in only";
  }

  return {
    platform,
    mode: capability?.productMode || "direct",
    configured: isPlatformConfigured(platform),
    capability_state: capabilityState,
    is_connected: connected,
    can_publish: canPublish,
    scope: scopes,
    linked_account:
      metadata?.profileData?.name ||
      metadata?.businessInfo?.accountName ||
      row?.platform_user_id ||
      null,
    author_urn:
      platform === "linkedin" && row?.platform_user_id
        ? row.platform_user_id.startsWith("urn:li:person:")
          ? row.platform_user_id
          : `urn:li:person:${row.platform_user_id}`
        : null,
    expires_at: row?.token_expires_at || null,
    last_validated_at: row?.last_validated_at || null,
    fallback_behavior: capability?.fallbackBehavior || null,
    supported_actions: capability?.supportedActions || [],
    unsupported_actions: capability?.unsupportedActions || []
  };
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

function decodeState(value) {
  try {
    return JSON.parse(Buffer.from(String(value || ""), "base64url").toString("utf8"));
  } catch (_error) {
    return {};
  }
}

function signOAuthState(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "10m" });
}

function verifyOAuthState(state) {
  return jwt.verify(state, process.env.JWT_SECRET);
}

async function ensureUserScaffold(userId) {
  await pool.query(
    `INSERT INTO workspace_settings (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );

  await pool.query(
    `INSERT INTO user_preferences (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
}

function getLinkedInRedirectUri(req) {
  return buildOAuthRedirectUri(
    req,
    "/api/channels/linkedin/callback",
    ["LINKEDIN_REDIRECT_URI", "LINKEDIN_AUTH_REDIRECT_URI"]
  );
}

function getDribbbleRedirectUri(req) {
  return buildOAuthRedirectUri(req, "/api/channels/dribbble/callback", ["DRIBBBLE_REDIRECT_URI"]);
}

function isGoogleChannelCallback(value) {
  return String(value || "").includes("/api/channels/googlemybusiness/callback");
}

function getGoogleChannelRedirectUri(req) {
  return buildOAuthRedirectUri(
    req,
    "/api/channels/googlemybusiness/callback",
    ["GOOGLE_CHANNEL_REDIRECT_URI", "GOOGLE_REDIRECT_URI", "GOOGLE_CALLBACK_URL"],
    isGoogleChannelCallback
  );
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
       is_active,
       last_validated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, platform)
     DO UPDATE SET
       platform_user_id = EXCLUDED.platform_user_id,
       access_token = EXCLUDED.access_token,
       refresh_token = EXCLUDED.refresh_token,
       token_expires_at = EXCLUDED.token_expires_at,
       metadata = EXCLUDED.metadata,
        is_active = TRUE,
       last_validated_at = CURRENT_TIMESTAMP,
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

    return hasConfiguredCredentials(clientId, clientSecret);
  }

  if (platform === "dribbble") {
    const clientId = cleanEnvValue(process.env.DRIBBBLE_CLIENT_ID);
    const clientSecret = cleanEnvValue(process.env.DRIBBBLE_CLIENT_SECRET);

    return hasConfiguredCredentials(clientId, clientSecret);
  }

  if (platform === "googlemybusiness") {
    const clientId = cleanEnvValue(process.env.GOOGLE_CLIENT_ID);
    const clientSecret = cleanEnvValue(process.env.GOOGLE_CLIENT_SECRET);

    return hasConfiguredCredentials(clientId, clientSecret);
  }

  return true;
}

router.get("/status", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT platform, platform_user_id, token_expires_at, is_active, metadata, updated_at, last_validated_at
       FROM user_channels
       WHERE user_id = $1
       ORDER BY platform`,
      [req.user.userId]
    );

    return res.json({
      channels: result.rows.map((row) => ({
        ...row,
        ...buildChannelCapabilityState(row.platform, row),
        setup_guide: getSetupGuide(row.platform)
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
      setupGuide: getSetupGuide(platform)
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
    const capability = getChannelCapability("linkedin");
    const clientId = cleanEnvValue(process.env.LINKEDIN_CLIENT_ID);
    const redirectUri = getLinkedInRedirectUri(req);
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: [...capability.requiredScopes.signIn, ...capability.requiredScopes.publish].join(" "),
      state
    });

    return res.json({
      url: `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
    });
  }

  if (platform === "dribbble") {
    const capability = getChannelCapability("dribbble");
    const params = new URLSearchParams({
      client_id: cleanEnvValue(process.env.DRIBBBLE_CLIENT_ID),
      redirect_uri: getDribbbleRedirectUri(req),
      scope: [...capability.requiredScopes.signIn, ...capability.requiredScopes.publish].join(" "),
      state
    });

    return res.json({
      url: `https://dribbble.com/oauth/authorize?${params.toString()}`
    });
  }

  if (platform === "googlemybusiness") {
    const capability = getChannelCapability("googlemybusiness");
    const clientId = cleanEnvValue(process.env.GOOGLE_CLIENT_ID);
    const redirectUri = getGoogleChannelRedirectUri(req);
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: capability.requiredScopes.publish.join(" "),
      access_type: "offline",
      state
    });

    return res.json({
      url: `https://accounts.google.com/oauth/authorize?${params.toString()}`
    });
  }
});

router.get("/:platform/setup-guide", authenticateToken, (req, res) => {
  const guide = getSetupGuide(req.params.platform);

  if (!guide) {
    return res.status(404).json({ error: "Setup guide not found" });
  }

  return res.json({
    ...guide,
    configured: isPlatformConfigured(req.params.platform)
  });
});

router.get("/:platform/validate", authenticateToken, async (req, res) => {
  const { platform } = req.params;

  if (!["linkedin", "dribbble", "behance", "googlemybusiness"].includes(platform)) {
    return res.status(400).json({ error: "Unsupported platform" });
  }

  if (platform === "behance") {
    return res.json({
      platform,
      ...buildChannelCapabilityState(platform, null),
      setup_guide: getSetupGuide(platform)
    });
  }

  try {
    const result = await pool.query(
      `SELECT platform, platform_user_id, token_expires_at, is_active, metadata, updated_at, last_validated_at
       FROM user_channels
       WHERE user_id = $1 AND platform = $2
       LIMIT 1`,
      [req.user.userId, platform]
    );

    const row = result.rows[0] || null;

    return res.json({
      platform,
      ...buildChannelCapabilityState(platform, row),
      setup_guide: getSetupGuide(platform)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/linkedin/connect", authenticateToken, (req, res) => {
  if (!isPlatformConfigured("linkedin")) {
    return res.status(400).json({ error: "LinkedIn is not configured in environment variables" });
  }

  const capability = getChannelCapability("linkedin");

  const state = encodeState({
    userId: req.user.userId,
    platform: "linkedin",
    mode: "channel-connect",
    returnTo: normalizeReturnTo(req.query.returnTo)
  });

  const clientId = cleanEnvValue(process.env.LINKEDIN_CLIENT_ID);
  const redirectUri = getLinkedInRedirectUri(req);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: [...capability.requiredScopes.signIn, ...capability.requiredScopes.publish].join(" "),
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

  const capability = getChannelCapability("dribbble");

  const state = signOAuthState({
    userId: req.user.userId,
    platform: "dribbble",
    returnTo: normalizeReturnTo(req.query.returnTo)
  });

  const params = new URLSearchParams({
    client_id: cleanEnvValue(process.env.DRIBBBLE_CLIENT_ID),
    redirect_uri: getDribbbleRedirectUri(req),
    scope: [...capability.requiredScopes.signIn, ...capability.requiredScopes.publish].join(" "),
    state
  });

  return res.redirect(`https://dribbble.com/oauth/authorize?${params.toString()}`);
});

router.get("/dribbble/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query;
  const clientId = cleanEnvValue(process.env.DRIBBBLE_CLIENT_ID);
  const clientSecret = cleanEnvValue(process.env.DRIBBBLE_CLIENT_SECRET);
  const redirectUri = getDribbbleRedirectUri(req);

  if (error) {
    return res.redirect(
      buildFrontendUrl(req, "/dashboard/channels", {
        oauth: "error",
        platform: "dribbble",
        message: error_description || error
      })
    );
  }

  if (!code || !state) {
    return res.redirect(
      buildFrontendUrl(req, "/dashboard/channels", {
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
        scope: "public upload",
        canPublish: false
      }
    });

    return res.redirect(
      buildFrontendUrl(req, decoded.returnTo || "/dashboard/channels", {
        oauth: "success",
        platform: "dribbble"
      })
    );
  } catch (error) {
    return res.redirect(
      buildFrontendUrl(req, "/dashboard/channels", {
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
  const redirectUri = getGoogleChannelRedirectUri(req);

  if (error) {
    return res.redirect(
      buildFrontendUrl(req, "/dashboard/channels", {
        oauth: "error",
        platform: "googlemybusiness",
        message: error_description || error
      })
    );
  }

  if (!code || !state) {
    return res.redirect(
      buildFrontendUrl(req, "/dashboard/channels", {
        oauth: "error",
        platform: "googlemybusiness",
        message: "Missing OAuth code or state"
      })
    );
  }

  try {
    const decoded = verifyOAuthState(state);
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: String(code),
      grant_type: "authorization_code",
      redirect_uri: redirectUri
    });
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      tokenParams.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

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
        canPublish: Boolean(platformUserId),
        businessInfo
      }
    });

    return res.redirect(
      buildFrontendUrl(req, decoded.returnTo || "/dashboard/channels", {
        oauth: "success",
        platform: "googlemybusiness"
      })
    );
  } catch (error) {
    return res.redirect(
      buildFrontendUrl(req, "/dashboard/channels", {
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
      const projectResult = await pool.query(
        `SELECT p.*, pf.content_json
         FROM projects p
         LEFT JOIN portfolios pf ON pf.project_id = p.id
         WHERE p.id = $1 AND p.user_id = $2`,
        [projectId, req.user.userId]
      );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }

      const project = projectResult.rows[0];
      const content = parseJsonField(project.content_json, {}) || {};
      const preview = parseJsonField(content.preview_json, {}) || {};
      const deliverables = parseStoredArray(content.deliverables || project.deliverables);
      const assetSources = parseStoredArray(content.asset_sources || project.assets_url);
      const tags = parseStoredArray(content.tags);

      behanceTemplate = {
        title: preview.title || project.title,
        intro: content.challenge || project.challenge_text ?
          `Challenge: ${(content.challenge || project.challenge_text).substring(0, 200)}${(content.challenge || project.challenge_text).length > 200 ? '...' : ''}` :
          "A comprehensive case study showcasing the project journey from concept to completion.",
        sections: [
          {
            title: "Challenge",
            content: content.challenge || project.challenge_text || "The project began with understanding the core business objectives and user needs."
          },
          {
            title: "Solution",
            content: content.solution || project.solution_text || "We developed a strategic approach that addressed the key challenges while delivering measurable results."
          },
          {
            title: "Deliverables",
            content: deliverables.length
              ? deliverables.join(", ")
              : "Complete project deliverables including design files, documentation, and implementation assets."
          },
          {
            title: "Results",
            content: content.results || project.results_text || "The project delivered successful outcomes that met or exceeded the established goals."
          },
          {
            title: "Gallery",
            content: assetSources.length ?
              `Project assets available: ${assetSources.map((asset) => typeof asset === "string" ? asset : asset.label || asset.url || "Asset").join(", ")}` :
              "Visual gallery showcasing key deliverables and project outcomes."
          }
        ],
        coverGuidance: "Lead with your strongest hero image and one quantified outcome.",
        tags: tags.length
          ? tags
          : ["portfolio", "case study", "design", "development", project.title.toLowerCase().replace(/\s+/g, '')],
        sourceUrl: preview.source_url || project.source_url || null
      };
    } else {
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

async function fetchLinkedInProfile(accessToken) {
  try {
    const profileResponse = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    const profileData = profileResponse.data || {};

    return {
      platformUserId: String(profileData.sub || profileData.id || ""),
      email: profileData.email || null,
      fullName:
        profileData.name ||
        [profileData.given_name, profileData.family_name].filter(Boolean).join(" ") ||
        null,
      profileData
    };
  } catch (_error) {
    const profileResponse = await axios.get("https://api.linkedin.com/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    const profileData = profileResponse.data || {};

    let email = null;

    try {
      const emailResponse = await axios.get(
        "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      email = emailResponse.data?.elements?.[0]?.["handle~"]?.emailAddress || null;
    } catch (_emailError) {
      email = null;
    }

    return {
      platformUserId: String(profileData.id || ""),
      email,
      fullName:
        [profileData.localizedFirstName, profileData.localizedLastName]
          .filter(Boolean)
          .join(" ") || null,
      profileData
    };
  }
}

async function handleLinkedInCallback(req, res) {
  const { code, state, error, error_description } = req.query;
  const clientId = cleanEnvValue(process.env.LINKEDIN_CLIENT_ID);
  const clientSecret = cleanEnvValue(process.env.LINKEDIN_CLIENT_SECRET);
  const redirectUri = getLinkedInRedirectUri(req);
  const decoded = decodeState(state);

  if (error) {
    return res.redirect(
      buildFrontendUrl(req, decoded.returnTo || "/dashboard/channels", {
        oauth: "error",
        platform: "linkedin",
        message: error_description || error
      })
    );
  }

  if (!code || !state) {
    return res.redirect(
      buildFrontendUrl(req, "/dashboard/channels", {
        oauth: "error",
        platform: "linkedin",
        message: "Missing OAuth code or state"
      })
    );
  }

  try {
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code: String(code),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri
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

    const profile = await fetchLinkedInProfile(tokenResponse.data.access_token);

    if (!profile.platformUserId) {
      throw new Error("LinkedIn profile ID was missing from the callback response");
    }

    if (decoded.mode === "login") {
      let userResult = await pool.query(
        "SELECT * FROM users WHERE linkedin_id = $1 OR email = $2 LIMIT 1",
        [profile.platformUserId, profile.email]
      );

      if (!userResult.rows[0]) {
        userResult = await pool.query(
          `INSERT INTO users (email, linkedin_id, full_name)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [
            profile.email || `linkedin-${profile.platformUserId}@portfolio-amplifier.local`,
            profile.platformUserId,
            profile.fullName
          ]
        );
      } else {
        userResult = await pool.query(
          `UPDATE users
           SET linkedin_id = $1,
               email = COALESCE($2, email),
               full_name = COALESCE($3, full_name),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4
           RETURNING *`,
          [profile.platformUserId, profile.email, profile.fullName, userResult.rows[0].id]
        );
      }

      await ensureUserScaffold(userResult.rows[0].id);

      return res.redirect(
        buildFrontendTokenRedirect(req, decoded.redirectTo || "/dashboard", signToken(userResult.rows[0]))
      );
    }

    await upsertChannel({
      userId: decoded.userId,
      platform: "linkedin",
      platformUserId: profile.platformUserId,
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token || null,
      expiresIn: tokenResponse.data.expires_in || null,
      metadata: {
        scope: tokenResponse.data.scope || "openid profile email w_member_social",
        canPublish: parseScopeList(tokenResponse.data.scope || "openid profile email w_member_social").includes("w_member_social"),
        authorUrn: `urn:li:person:${profile.platformUserId}`,
        profileData: profile.profileData
      }
    });

    return res.redirect(
      buildFrontendUrl(req, decoded.returnTo || "/dashboard/channels", {
        oauth: "success",
        platform: "linkedin"
      })
    );
  } catch (callbackError) {
    return res.redirect(
      buildFrontendUrl(req, "/dashboard/channels", {
        oauth: "error",
        platform: "linkedin",
        message:
          callbackError.response?.data?.error_description ||
          callbackError.response?.data?.message ||
          callbackError.message ||
          "LinkedIn connection failed"
      })
    );
  }
}

router.get("/linkedin/callback", handleLinkedInCallback);
router.get("/auth/linkedin/callback", handleLinkedInCallback);

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
