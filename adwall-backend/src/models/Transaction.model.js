const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    wallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    category: {
      type: String,
      enum: ["booking_payment", "booking_refund", "owner_payout",
             "platform_fee", "withdrawal", "wallet_topup"],
      required: true,
    },

    amount: { type: Number, required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },

    description: { type: String, required: true },
    reference: { type: mongoose.Schema.Types.ObjectId, refPath: "referenceModel", default: null },
    referenceModel: { type: String, enum: ["Booking", "Payment", null], default: null },

    status: { type: String, enum: ["success", "pending", "failed"], default: "success" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
