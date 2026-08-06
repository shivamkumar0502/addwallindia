const express = require("express");
const router = express.Router();
const { sendChatMessage, getSuggestions } = require("../controllers/chatbot.controller");
const rateLimit = require("express-rate-limit");

// Chatbot ke liye strict rate limit (spam prevent karne ke liye)
const chatbotLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15,
  message: { success: false, message: "Thoda ruko! 1 minute baad try karo." },
});

router.post("/message", chatbotLimiter, sendChatMessage);
router.get("/suggestions", getSuggestions);

module.exports = router;
