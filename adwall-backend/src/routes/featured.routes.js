const express = require("express");
const router = express.Router();
const { createFeaturedOrder, verifyFeaturedPayment, getFeaturedHoardings, adminSetFeatured } = require("../controllers/featured.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.get("/", getFeaturedHoardings);
router.post("/create-order", protect, authorize("owner"), createFeaturedOrder);
router.post("/verify", protect, authorize("owner"), verifyFeaturedPayment);
router.patch("/:hoardingId/admin-set", protect, authorize("admin"), adminSetFeatured);

module.exports = router;
