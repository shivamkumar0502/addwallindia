const express = require("express");
const router = express.Router();
const { validateCoupon, applyCoupon, adminGetCoupons, adminCreateCoupon, adminToggleCoupon, adminDeleteCoupon } = require("../controllers/coupon.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.post("/validate", protect, validateCoupon);
router.post("/apply", protect, applyCoupon);
router.get("/admin", protect, authorize("admin"), adminGetCoupons);
router.post("/admin", protect, authorize("admin"), adminCreateCoupon);
router.patch("/admin/:id/toggle", protect, authorize("admin"), adminToggleCoupon);
router.delete("/admin/:id", protect, authorize("admin"), adminDeleteCoupon);
module.exports = router;
