// const express = require("express");
// const router = express.Router();
// const { registerUser, loginUser, refreshAccessToken, logoutUser, googleLogin } = require("../controllers/auth.controller");
// const { protect } = require("../middlewares/auth.middleware");

// router.post("/register", registerUser);
// router.post("/login", loginUser);
// router.post("/google", googleLogin);
// router.post("/refresh", refreshAccessToken);
// router.post("/logout", protect, logoutUser);

// module.exports = router;

const express = require("express");
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  googleLogin,
  googleComplete,
} = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.post("/google", googleLogin);
router.post("/google/complete", googleComplete);

module.exports = router;
