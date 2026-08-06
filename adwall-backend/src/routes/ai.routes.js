const express = require("express");
const router = express.Router();
const { getVisibilityScore, getPriceRecommendation, getMediaPlan, getBudgetPlan } = require("../controllers/ai.controller");
const { protect } = require("../middlewares/auth.middleware");

router.get("/visibility-score/:hoardingId", getVisibilityScore);
router.get("/price-recommendation/:hoardingId", protect, getPriceRecommendation);
router.post("/media-planner", protect, getMediaPlan);
router.post("/budget-planner", protect, getBudgetPlan);

module.exports = router;
