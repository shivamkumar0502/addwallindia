const express = require("express");
const router = express.Router();
const { createReview, getHoardingReviews, replyToReview } = require("../controllers/review.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.post("/", protect, authorize("client"), createReview);
router.get("/hoarding/:hoardingId", getHoardingReviews);
router.post("/:id/reply", protect, authorize("owner"), replyToReview);

module.exports = router;
