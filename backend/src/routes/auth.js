const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");

const { pool } = require("../database/config");
const { authenticateToken, signToken } = require("../middleware/auth");

const router = express.Router();

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

router.post("/register", async (req, res) => {
  const { email, password, full_name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [email.toLowerCase(), passwordHash, full_name || null]
    );

    const user = result.rows[0];
    return res.status(201).json({
      user: serializeUser(user),
      token: signToken(user)
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "A user with this email already exists" });
    }

    return res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
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
        return res.status(500).send("Google authentication failed");
      }

      const client = await pool.connect();

      try {
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

        await client.query("COMMIT");

        const user = userResult.rows[0];
        const redirectState = decodeState(req.query.state);
        const redirectTo = redirectState.redirectTo || "/dashboard";
        const redirectUrl = new URL(
          redirectTo,
          process.env.FRONTEND_URL || "http://localhost:3001"
        );

        redirectUrl.searchParams.set("token", signToken(user));

        return res.redirect(redirectUrl.toString());
      } catch (dbError) {
        await client.query("ROLLBACK");
        return res.status(500).send("Google authentication failed");
      } finally {
        client.release();
      }
    }
  )(req, res, next);
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

  const client = await pool.connect();

  try {
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
    await client.query("ROLLBACK");
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
