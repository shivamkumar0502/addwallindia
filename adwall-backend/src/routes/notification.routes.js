const express = require("express");
const router = express.Router();
const { getMyNotifications, markAsRead, markAllAsRead } = require("../controllers/notification.controller");
const { protect } = require("../middlewares/auth.middleware");

router.get("/", protect, getMyNotifications);
router.patch("/read-all", protect, markAllAsRead);
router.patch("/:id/read", protect, markAsRead);

module.exports = router;
