const express = require("express");
const router = express.Router();
const { getAdminStats, getOwnerAnalytics, getClientAnalytics } = require("../controllers/analytics.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.get("/admin", protect, authorize("admin"), getAdminStats);
router.get("/owner", protect, authorize("owner"), getOwnerAnalytics);
router.get("/client", protect, authorize("client"), getClientAnalytics);

module.exports = router;
