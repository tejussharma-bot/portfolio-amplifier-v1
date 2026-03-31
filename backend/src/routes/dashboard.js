const express = require("express");

const { pool } = require("../database/config");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);

router.get("/summary", async (req, res) => {
  try {
    const userId = req.user.userId;

    const [
      projectResult,
      draftResult,
      reviewResult,
      channelResult,
      preferenceResult
    ] = await Promise.all([
      pool.query(
        `SELECT id, title, status, created_at, updated_at
         FROM projects
         WHERE user_id = $1
         ORDER BY updated_at DESC`,
        [userId]
      ),
      pool.query(
        `SELECT gc.id, gc.platform, gc.status, gc.scheduled_for, gc.created_at, p.title
         FROM generated_content gc
         INNER JOIN projects p ON p.id = gc.project_id
         WHERE p.user_id = $1
         ORDER BY gc.created_at DESC`,
        [userId]
      ),
      pool.query(
        `SELECT id, reviewer_name, sentiment, is_responded, created_at
         FROM reviews
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      ),
      pool.query(
        `SELECT platform, is_active, token_expires_at
         FROM user_channels
         WHERE user_id = $1
         ORDER BY platform`,
        [userId]
      ),
      pool.query(
        `SELECT first_goal
         FROM user_preferences
         WHERE user_id = $1`,
        [userId]
      )
    ]);

    const projects = projectResult.rows;
    const drafts = draftResult.rows;
    const reviews = reviewResult.rows;
    const channels = channelResult.rows;
    const firstGoal = preferenceResult.rows[0]?.first_goal || "Build my first portfolio";

    const summary = {
      projectsInProgress: projects.filter((project) => project.status !== "published").length,
      readyToPublish: drafts.filter((draft) => draft.status === "draft").length,
      scheduledPosts: drafts.filter((draft) => draft.status === "scheduled").length,
      unansweredReviews: reviews.filter((review) => !review.is_responded).length,
      connectedChannels: channels.filter((channel) => channel.is_active).length
    };

    const suggestions = [];

    if (summary.projectsInProgress > 0) {
      suggestions.push("Complete your strongest case study so Publish Studio has richer proof.");
    }

    if (summary.readyToPublish > 0) {
      suggestions.push("You already have channel drafts ready. Review the CTA and schedule the best one.");
    }

    if (summary.unansweredReviews > 0) {
      suggestions.push("Respond to recent reviews before they stack up into a slower reputation problem.");
    }

    if (channels.length === 0) {
      suggestions.push("Connect LinkedIn first for the fastest path to direct publishing in V1.");
    }

    return res.json({
      summary,
      firstGoal,
      suggestions,
      recentProjects: projects.slice(0, 4),
      recentDrafts: drafts.slice(0, 4),
      recentReviews: reviews.slice(0, 4),
      channels
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
