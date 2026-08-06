const express = require("express");
const router = express.Router();
const { getPlans, getMySubscription, createUpgradeOrder, verifySubscription, adminGetSubscriptions } = require("../controllers/subscription.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.get("/plans", getPlans);
router.get("/me", protect, authorize("owner"), getMySubscription);
router.post("/upgrade", protect, authorize("owner"), createUpgradeOrder);
router.post("/verify", protect, authorize("owner"), verifySubscription);
router.get("/admin/all", protect, authorize("admin"), adminGetSubscriptions);
module.exports = router;
