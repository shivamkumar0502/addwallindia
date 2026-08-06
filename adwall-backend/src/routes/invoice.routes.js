const express = require("express");
const router = express.Router();
const { generateInvoice } = require("../controllers/invoice.controller");
const { protect } = require("../middlewares/auth.middleware");

router.get("/booking/:bookingId", protect, generateInvoice);
module.exports = router;
