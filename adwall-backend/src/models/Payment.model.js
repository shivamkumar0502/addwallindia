const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    amount: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    ownerPayout: { type: Number, required: true },
    gst: { type: Number, default: 0 },

    // Razorpay fields
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },

    status: {
      type: String,
      enum: ["order_created", "paid", "escrow_hold", "released", "refunded", "failed"],
      default: "order_created",
    },

    // Escrow tracking
    escrow: {
      heldAt: { type: Date, default: null },
      releasedAt: { type: Date, default: null },
      releaseReason: { type: String, default: null }, // "client_approved" | "auto_release" | "admin_manual"
    },

    refund: {
      razorpayRefundId: { type: String, default: null },
      amount: { type: Number, default: null },
      reason: { type: String, default: null },
      refundedAt: { type: Date, default: null },
    },

    method: { type: String, default: null }, // upi, card, netbanking
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
