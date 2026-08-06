const express = require("express");
const router = express.Router();
const { generateAgreement, getAgreementByBooking, signAgreement } = require("../controllers/agreement.controller");
const { protect } = require("../middlewares/auth.middleware");

router.post("/generate/:bookingId", protect, generateAgreement);
router.get("/booking/:bookingId", protect, getAgreementByBooking);
router.post("/:id/sign", protect, signAgreement);

module.exports = router;
