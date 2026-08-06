const express = require("express");
const router = express.Router();
const { registerUser, loginUser, refreshAccessToken, logoutUser, googleLogin } = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/refresh", refreshAccessToken);
router.post("/logout", protect, logoutUser);

module.exports = router;
