const express = require("express");

const { pool } = require("../database/config");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);

function safeJson(value, fallback) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  return value;
}

router.get("/", async (req, res) => {
  try {
    const [userResult, preferenceResult, settingsResult, channelResult] = await Promise.all([
      pool.query(
        `SELECT id, email, full_name, account_type, professional_role, role, website, industry,
                services_offered, brand_voice, created_at, updated_at
         FROM users
         WHERE id = $1`,
        [req.user.userId]
      ),
      pool.query(
        `SELECT channels_used, first_goal, updated_at
         FROM user_preferences
         WHERE user_id = $1`,
        [req.user.userId]
      ),
      pool.query(
        `SELECT default_objective, default_tone, default_review_tone, timezone,
                publishing_defaults, notification_preferences, updated_at
         FROM workspace_settings
         WHERE user_id = $1`,
        [req.user.userId]
      ),
      pool.query(
        `SELECT platform, platform_user_id, token_expires_at, is_active, metadata
         FROM user_channels
         WHERE user_id = $1
         ORDER BY platform`,
        [req.user.userId]
      )
    ]);

    if (!userResult.rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      profile: userResult.rows[0],
      preferences: preferenceResult.rows[0] || {
        channels_used: [],
        first_goal: null
      },
      defaults: settingsResult.rows[0] || {
        default_objective: "Get clients",
        default_tone: "Professional",
        default_review_tone: "professional",
        timezone: "Asia/Calcutta",
        publishing_defaults: {},
        notification_preferences: {}
      },
      channels: channelResult.rows
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.put("/profile", async (req, res) => {
  const {
    full_name,
    account_type,
    professional_role,
    role,
    website,
    industry,
    services_offered,
    brand_voice
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           account_type = COALESCE($2, account_type),
           professional_role = COALESCE($3, professional_role),
           role = COALESCE($4, role),
           website = COALESCE($5, website),
           industry = COALESCE($6, industry),
           services_offered = COALESCE($7, services_offered),
           brand_voice = COALESCE($8, brand_voice),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING id, email, full_name, account_type, professional_role, role, website, industry,
                 services_offered, brand_voice, created_at, updated_at`,
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

    return res.json({ profile: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.put("/defaults", async (req, res) => {
  const {
    default_objective,
    default_tone,
    default_review_tone,
    timezone,
    publishing_defaults,
    notification_preferences
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO workspace_settings (
         user_id,
         default_objective,
         default_tone,
         default_review_tone,
         timezone,
         publishing_defaults,
         notification_preferences
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id)
       DO UPDATE SET
         default_objective = EXCLUDED.default_objective,
         default_tone = EXCLUDED.default_tone,
         default_review_tone = EXCLUDED.default_review_tone,
         timezone = EXCLUDED.timezone,
         publishing_defaults = EXCLUDED.publishing_defaults,
         notification_preferences = EXCLUDED.notification_preferences,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        req.user.userId,
        default_objective || "Get clients",
        default_tone || "Professional",
        default_review_tone || "professional",
        timezone || "Asia/Calcutta",
        JSON.stringify(safeJson(publishing_defaults, {})),
        JSON.stringify(safeJson(notification_preferences, {}))
      ]
    );

    return res.json({ defaults: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete("/data", async (req, res) => {
  const { confirmEmail } = req.body || {};

  try {
    const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [req.user.userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!confirmEmail || String(confirmEmail).toLowerCase() !== String(user.email).toLowerCase()) {
      return res.status(400).json({
        error: "confirmEmail must match the current account email before deletion"
      });
    }

    await pool.query("DELETE FROM users WHERE id = $1", [req.user.userId]);

    return res.json({ message: "Account data deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
