const express = require("express");
const router = express.Router();
const { submitKyc, getMyKycStatus, getPendingKycList, reviewKyc } = require("../controllers/kyc.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// Owner routes
router.post(
  "/submit",
  protect,
  authorize("owner"),
  upload.fields([
    { name: "aadhaar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]),
  submitKyc
);
router.get("/status", protect, authorize("owner"), getMyKycStatus);

// Admin routes
router.get("/pending", protect, authorize("admin"), getPendingKycList);
router.patch("/:userId/review", protect, authorize("admin"), reviewKyc);

module.exports = router;
