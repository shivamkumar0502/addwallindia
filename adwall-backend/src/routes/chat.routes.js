const express = require("express");
const router = express.Router();
const { getOrCreateConversation, getMessages, sendMessage, getMyConversations } = require("../controllers/chat.controller");
const { protect } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

router.get("/my", protect, getMyConversations);
router.get("/booking/:bookingId", protect, getOrCreateConversation);
router.get("/:conversationId/messages", protect, getMessages);
router.post("/:conversationId/send", protect, upload.single("image"), sendMessage);

module.exports = router;
