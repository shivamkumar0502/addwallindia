const express = require("express");
const router = express.Router();
const { sendContactMessage } = require("../controllers/contact.controller");

// Public — koi bhi contact form bhar sakta hai
router.post("/", sendContactMessage);

module.exports = router;