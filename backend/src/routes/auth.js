const express = require("express");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const rateLimit = require("express-rate-limit");

const { pool } = require("../database/config");
const { authenticateToken, signToken } = require("../middleware/auth");
const {
  cleanEnvValue,
  getAuthProviderStatus,
  hasConfiguredCredentials
} = require("../utils/config");

const router = express.Router();

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: "Too many login attempts. Please try again in 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

function serializeUser(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    accountType: row.account_type,
    professionalRole: row.professional_role,
    role: row.role,
    brandVoice: row.brand_voice,
    website: row.website,
    industry: row.industry
  };
}

function encodeState(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeState(value) {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch (error) {
    return {};
  }
}

function getRequestOrigin(req) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = forwardedHost || req.headers.host;

  // Allowed hosts for security
  const allowedHosts = (process.env.ALLOWED_HOSTS || "localhost:3000,localhost:3001,portfolio-amplifier-v1.vercel.app")
    .split(",")
    .map(h => h.trim().toLowerCase());

  if (host) {
    const hostLower = host.toLowerCase();
    const isAllowed = allowedHosts.some(allowed => 
      hostLower === allowed || hostLower.endsWith('.' + allowed)
    );

    if (!isAllowed) {
      throw new Error(`Host ${host} is not allowed`);
    }

    const proto = forwardedProto || (process.env.VERCEL ? "https" : req.protocol || "http");
    return `${proto}://${host}`;
  }

  return cleanEnvValue(process.env.FRONTEND_URL) || "http://localhost:3001";
}

function buildFrontendRedirect(req, pathname, token) {
  const redirectUrl = new URL(pathname || "/dashboard", getRequestOrigin(req));

  redirectUrl.searchParams.set("token", token);
  return redirectUrl.toString();
}

async function ensureUserScaffold(client, userId) {
  await client.query(
    `INSERT INTO workspace_settings (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );

  await client.query(
    `INSERT INTO user_preferences (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
}

router.get("/providers", (_req, res) => {
  return res.json({
    providers: getAuthProviderStatus()
  });
});

router.post("/register", async (req, res) => {
  const { email, password, full_name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  let client;

  try {
    client = await pool.connect();
    const passwordHash = await bcrypt.hash(password, 10);
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [email.toLowerCase(), passwordHash, full_name || null]
    );

    const user = result.rows[0];
    await ensureUserScaffold(client, user.id);
    await client.query("COMMIT");

    return res.status(201).json({
      user: serializeUser(user),
      token: signToken(user)
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }

    if (error.code === "23505") {
      return res.status(409).json({ error: "A user with this email already exists" });
    }

    return res.status(500).json({ error: error.message });
  } finally {
    client?.release();
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase()
    ]);

    const user = result.rows[0];

    if (!user?.password_hash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return res.json({
      user: serializeUser(user),
      token: signToken(user)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/google", (req, res, next) => {
  if (!passport._strategies.google) {
    return res.status(500).json({ error: "Google OAuth is not configured" });
  }

  const state = encodeState({
    mode: "login",
    redirectTo: req.query.redirectTo || "/dashboard"
  });

  return passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state
  })(req, res, next);
});

router.get("/google/callback", (req, res, next) => {
  if (!passport._strategies.google) {
    return res.status(500).send("Google OAuth is not configured");
  }

  return passport.authenticate(
    "google",
    { session: false },
    async (error, profile) => {
      if (error || !profile?.email) {
        console.error("Google OAuth error:", error);
        return res.status(401).json({ 
          error: "Google authentication failed",
          detail: error?.message || "Profile missing email"
        });
      }
      let client;

      try {
        client = await pool.connect();
        await client.query("BEGIN");

        let userResult = await client.query(
          "SELECT * FROM users WHERE google_id = $1 OR email = $2 LIMIT 1",
          [profile.googleId, profile.email.toLowerCase()]
        );

        if (!userResult.rows[0]) {
          userResult = await client.query(
            `INSERT INTO users (email, google_id, full_name)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [profile.email.toLowerCase(), profile.googleId, profile.fullName || null]
          );
        } else {
          userResult = await client.query(
            `UPDATE users
             SET google_id = $1,
                 full_name = COALESCE($2, full_name),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [profile.googleId, profile.fullName || null, userResult.rows[0].id]
          );
        }

        await ensureUserScaffold(client, userResult.rows[0].id);

        await client.query("COMMIT");

        const user = userResult.rows[0];
        const redirectState = decodeState(req.query.state);
        const redirectTo = redirectState.redirectTo || "/dashboard";
        return res.redirect(buildFrontendRedirect(req, redirectTo, signToken(user)));
      } catch (dbError) {
        if (client) {
          await client.query("ROLLBACK");
        }
        return res.status(500).send("Google authentication failed");
      } finally {
        client?.release();
      }
    }
  )(req, res, next);
});

router.get("/linkedin", (req, res) => {
  const clientId = cleanEnvValue(process.env.LINKEDIN_CLIENT_ID);
  const clientSecret = cleanEnvValue(process.env.LINKEDIN_CLIENT_SECRET);
  const redirectUri = cleanEnvValue(process.env.LINKEDIN_AUTH_REDIRECT_URI);

  if (
    !hasConfiguredCredentials(
      clientId,
      clientSecret,
      redirectUri
    )
  ) {
    return res.status(500).json({ error: "LinkedIn OAuth is not configured" });
  }

  const state = encodeState({
    mode: "login",
    redirectTo: req.query.redirectTo || "/dashboard"
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid profile email",
    state
  });

  return res.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  );
});

router.get("/linkedin/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query;
  const redirectUri = cleanEnvValue(process.env.LINKEDIN_AUTH_REDIRECT_URI);
  const clientId = cleanEnvValue(process.env.LINKEDIN_CLIENT_ID);
  const clientSecret = cleanEnvValue(process.env.LINKEDIN_CLIENT_SECRET);

  if (error) {
    console.error("LinkedIn OAuth error:", error_description);
    return res.status(401).json({ 
      error: "LinkedIn authentication failed",
      detail: error_description || error
    });
  }

  if (!code || !state) {
    return res.status(400).json({ error: "Missing LinkedIn OAuth code or state" });
  }
  let client;

  try {
    client = await pool.connect();
    const redirectState = decodeState(state);
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code: String(code),
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret
    });

    let tokenResponse;
    try {
      tokenResponse = await axios.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        tokenParams.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          }
        }
      );
    } catch (axiosError) {
      console.error("LinkedIn token exchange failed:", axiosError.response?.data || axiosError.message);
      return res.status(400).json({ 
        error: "Failed to authenticate with LinkedIn",
        detail: "Token exchange failed"
      });
    }

    let userInfoResponse;
    try {
      userInfoResponse = await axios.get("https://api.linkedin.com/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${tokenResponse.data.access_token}`
        }
      });
    } catch (axiosError) {
      console.error("LinkedIn user info fetch failed:", axiosError.response?.data || axiosError.message);
      return res.status(400).json({ 
        error: "Failed to get LinkedIn user information",
        detail: "User info request failed"
      });
    }

    const linkedinProfile = userInfoResponse.data;

    if (!linkedinProfile?.sub) {
      return res.status(500).send("LinkedIn authentication failed");
    }

    const email = linkedinProfile.email
      ? String(linkedinProfile.email).toLowerCase()
      : null;
    const fullName =
      linkedinProfile.name ||
      [linkedinProfile.given_name, linkedinProfile.family_name]
        .filter(Boolean)
        .join(" ") ||
      null;

    await client.query("BEGIN");

    if (redirectState.mode === "channel-connect") {
      await client.query(
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
         VALUES ($1, 'linkedin', $2, $3, NULL, $4, $5, TRUE)
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
          redirectState.userId,
          linkedinProfile.sub,
          tokenResponse.data.access_token,
          tokenResponse.data.expires_in
            ? new Date(Date.now() + Number(tokenResponse.data.expires_in) * 1000)
            : null,
          JSON.stringify({
            scope: "openid profile email",
            connectionMode: "identity-only",
            canPublish: false,
            profile: {
              sub: linkedinProfile.sub,
              name: fullName,
              email
            }
          })
        ]
      );

      await client.query("COMMIT");

      const channelRedirect = new URL(
        redirectState.returnTo || "/dashboard/channels",
        getRequestOrigin(req)
      );
      channelRedirect.searchParams.set("oauth", "success");
      channelRedirect.searchParams.set("platform", "linkedin");
      return res.redirect(channelRedirect.toString());
    }

    let userResult = await client.query(
      "SELECT * FROM users WHERE linkedin_id = $1 OR email = $2 LIMIT 1",
      [linkedinProfile.sub, email]
    );

    if (!userResult.rows[0]) {
      userResult = await client.query(
        `INSERT INTO users (email, linkedin_id, full_name)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [
          email || `linkedin-${linkedinProfile.sub}@portfolio-amplifier.local`,
          linkedinProfile.sub,
          fullName
        ]
      );
    } else {
      userResult = await client.query(
        `UPDATE users
         SET linkedin_id = $1,
             email = COALESCE($2, email),
             full_name = COALESCE($3, full_name),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [linkedinProfile.sub, email, fullName, userResult.rows[0].id]
      );
    }

    await ensureUserScaffold(client, userResult.rows[0].id);

    await client.query("COMMIT");

    const user = userResult.rows[0];
    return res.redirect(
      buildFrontendRedirect(req, redirectState.redirectTo || "/dashboard", signToken(user))
    );
  } catch (authError) {
    if (client) {
      await client.query("ROLLBACK");
    }
    return res.status(500).send("LinkedIn authentication failed");
  } finally {
    client?.release();
  }
});

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.userId]);

    if (!result.rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: serializeUser(result.rows[0]) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/onboarding", authenticateToken, async (req, res) => {
  const {
    full_name,
    account_type,
    professional_role,
    role,
    website,
    industry,
    services_offered,
    brand_voice,
    channels_used = [],
    first_goal
  } = req.body;
  let client;

  try {
    client = await pool.connect();
    const userCheck = await client.query("SELECT id FROM users WHERE id = $1 LIMIT 1", [
      req.user.userId
    ]);

    if (!userCheck.rows[0]) {
      await client.query("ROLLBACK").catch(() => {});
      return res.status(409).json({
        error:
          "Authenticated user record was not found in the current database. Configure DATABASE_URL for persistent storage or restart the dev session."
      });
    }

    await client.query("BEGIN");

    await client.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           account_type = $2,
           professional_role = $3,
           role = $4,
           website = $5,
           industry = $6,
           services_offered = $7,
           brand_voice = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9`,
      [
        full_name || null,
        account_type || null,
        professional_role || null,
        role || null,
        website || null,
        industry || null,
        services_offered || null,
        brand_voice || null,
        req.user.userId
      ]
    );

    await client.query(
      `INSERT INTO user_preferences (user_id, channels_used, first_goal)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET
         channels_used = EXCLUDED.channels_used,
         first_goal = EXCLUDED.first_goal,
         updated_at = CURRENT_TIMESTAMP`,
      [req.user.userId, JSON.stringify(channels_used), first_goal || null]
    );

    await client.query("COMMIT");

    const nextStep =
      first_goal === "Turn an existing project into posts"
        ? "/dashboard/publish-studio"
        : first_goal === "Organize my reviews"
          ? "/dashboard/reviews"
          : "/dashboard/projects";

    return res.json({
      message: "Onboarding complete",
      nextStep
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

module.exports = router;
