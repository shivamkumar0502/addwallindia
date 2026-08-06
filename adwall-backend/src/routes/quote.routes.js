const express = require("express");
const router = express.Router();
const { sendQuote, acceptQuote, rejectQuote, counterOffer, getQuotesByBooking } = require("../controllers/quote.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.post("/", protect, authorize("owner"), sendQuote);
router.post("/:id/accept", protect, authorize("client"), acceptQuote);
router.post("/:id/reject", protect, authorize("client"), rejectQuote);
router.post("/:id/counter", protect, counterOffer);
router.get("/booking/:bookingId", protect, getQuotesByBooking);

module.exports = router;
