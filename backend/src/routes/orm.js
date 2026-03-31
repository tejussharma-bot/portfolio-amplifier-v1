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
