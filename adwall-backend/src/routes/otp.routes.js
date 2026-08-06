const express = require("express");
const router = express.Router();
const { forgotPassword, resetPassword, sendMobileOTP, verifyMobileOTP } = require("../controllers/otp.controller");
const { protect } = require("../middlewares/auth.middleware");

// Public routes (forgot/reset password)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes (mobile verify)
router.post("/send-mobile-otp", protect, sendMobileOTP);
router.post("/verify-mobile", protect, verifyMobileOTP);

module.exports = router;
