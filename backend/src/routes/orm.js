const express = require("express");

const { pool } = require("../database/config");
const { authenticateToken } = require("../middleware/auth");
const {
  classifySentiment,
  generateReviewReply
} = require("../services/ai");

const router = express.Router();

router.use(authenticateToken);

async function getOwnedReview(reviewId, userId) {
  const result = await pool.query(
    "SELECT * FROM reviews WHERE id = $1 AND user_id = $2",
    [reviewId, userId]
  );

  return result.rows[0];
}

router.get("/", async (req, res) => {
  try {
    const reviewsResult = await pool.query(
      `SELECT *
       FROM reviews
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );

    const reviews = reviewsResult.rows;
    const summary = {
      total: reviews.length,
      pending: reviews.filter((review) => !review.is_responded).length,
      positive: reviews.filter((review) => review.sentiment === "positive").length,
      neutral: reviews.filter((review) => review.sentiment === "neutral").length,
      negative: reviews.filter((review) => review.sentiment === "negative").length
    };

    return res.json({ summary, reviews });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/insights", async (req, res) => {
  try {
    const [reviewResult, projectResult] = await Promise.all([
      pool.query(
        `SELECT project_id, rating, sentiment, review_text
         FROM reviews
         WHERE user_id = $1`,
        [req.user.userId]
      ),
      pool.query(
        `SELECT id, title
         FROM projects
         WHERE user_id = $1`,
        [req.user.userId]
      )
    ]);

    const reviews = reviewResult.rows;
    const projectMap = new Map(projectResult.rows.map((project) => [project.id, project.title]));

    const praiseThemes = [];
    const complaintThemes = [];

    reviews.forEach((review) => {
      const text = String(review.review_text || "").toLowerCase();

      if (review.sentiment === "positive") {
        if (text.includes("strategy")) praiseThemes.push("Strategic clarity");
        if (text.includes("impact") || text.includes("result")) praiseThemes.push("Business impact");
        if (text.includes("design") || text.includes("craft")) praiseThemes.push("Strong final craft");
      }

      if (review.sentiment === "negative" || review.sentiment === "neutral") {
        if (text.includes("late") || text.includes("timing")) complaintThemes.push("Timeline visibility");
        if (text.includes("communicat")) complaintThemes.push("Communication cadence");
        if (text.includes("scope") || text.includes("revision")) complaintThemes.push("Expectation setting");
      }
    });

    const projectScores = new Map();
    reviews.forEach((review) => {
      if (!review.project_id) {
        return;
      }

      const current = projectScores.get(review.project_id) || { total: 0, count: 0 };
      current.total += Number(review.rating || 0);
      current.count += 1;
      projectScores.set(review.project_id, current);
    });

    const bestProject = [...projectScores.entries()]
      .map(([projectId, stats]) => ({
        projectId,
        title: projectMap.get(projectId) || "Untitled project",
        averageRating: stats.total / Math.max(stats.count, 1)
      }))
      .sort((a, b) => b.averageRating - a.averageRating)[0] || null;

    return res.json({
      praiseThemes: [...new Set(praiseThemes)].slice(0, 4),
      complaintThemes: [...new Set(complaintThemes)].slice(0, 4),
      suggestedImprovements: [
        "Create clearer milestone updates during delivery.",
        "Turn strong outcomes into visible case-study proof sooner.",
        "Save approval-ready reply tones for faster ORM handling."
      ],
      bestReviewedProject: bestProject
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const review = await getOwnedReview(req.params.id, req.user.userId);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    return res.json({ review });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/ingest", async (req, res) => {
  const {
    projectId = null,
    sourcePlatform,
    reviewerName,
    rating = 5,
    reviewText
  } = req.body;

  if (!reviewerName || !reviewText || !sourcePlatform) {
    return res.status(400).json({
      error: "sourcePlatform, reviewerName, and reviewText are required"
    });
  }

  try {
    const sentiment = classifySentiment({
      rating: Number(rating),
      reviewText
    });

    const result = await pool.query(
      `INSERT INTO reviews (
         user_id,
         project_id,
         source_platform,
         reviewer_name,
         rating,
         review_text,
         sentiment
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.userId,
        projectId,
        sourcePlatform,
        reviewerName,
        Number(rating),
        reviewText,
        sentiment
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/:id/respond", async (req, res) => {
  const { tone = "professional" } = req.body;

  try {
    const review = await getOwnedReview(req.params.id, req.user.userId);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    const responseDraft = await generateReviewReply(review, tone);

    await pool.query(
      `UPDATE reviews
       SET response_draft = $1,
           response_tone = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [responseDraft, tone, review.id]
    );

    return res.json({ draft: responseDraft });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/:id/approve", async (req, res) => {
  const { responseDraft } = req.body;

  try {
    const review = await getOwnedReview(req.params.id, req.user.userId);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    const nextDraft = responseDraft || review.response_draft;

    await pool.query(
      `UPDATE reviews
       SET response_draft = $1,
           is_responded = TRUE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [nextDraft, review.id]
    );

    return res.json({
      message: "Review response approved",
      responseDraft: nextDraft
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
