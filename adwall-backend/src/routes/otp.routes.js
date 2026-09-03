const express = require("express");
const router = express.Router();
const {
  forgotPassword,
  resetPassword,
  sendMobileOTP,
  verifyMobileOTP,
  sendRegisterOTP,
  verifyRegisterOTP,
} = require("../controllers/otp.controller");
const { protect } = require("../middlewares/auth.middleware");

// Public — forgot/reset password
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Public — registration verification (naya)
router.post("/send-register-otp", sendRegisterOTP);
router.post("/verify-register-otp", verifyRegisterOTP);

// Protected — logged-in user ka mobile change/verify
router.post("/send-mobile-otp", protect, sendMobileOTP);
router.post("/verify-mobile", protect, verifyMobileOTP);

module.exports = router;