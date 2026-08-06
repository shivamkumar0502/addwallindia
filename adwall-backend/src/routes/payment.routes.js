const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment, refundPayment, getPaymentByBooking, adminGetAllPayments } = require("../controllers/payment.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.post("/create-order", protect, authorize("client"), createOrder);
router.post("/verify", protect, authorize("client"), verifyPayment);
router.get("/admin/all", protect, authorize("admin"), adminGetAllPayments);
router.post("/:id/refund", protect, authorize("admin"), refundPayment);
router.get("/booking/:bookingId", protect, getPaymentByBooking);

module.exports = router;
