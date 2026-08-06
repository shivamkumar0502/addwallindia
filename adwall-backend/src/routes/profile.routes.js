const express = require("express");
const router = express.Router();
const { getProfile, updateProfile, changePassword, deleteAccount } = require("../controllers/profile.controller");
const { protect } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

router.get("/me", protect, getProfile);
router.patch("/update", protect, upload.single("avatar"), updateProfile);
router.patch("/change-password", protect, changePassword);
router.delete("/delete", protect, deleteAccount);

module.exports = router;
