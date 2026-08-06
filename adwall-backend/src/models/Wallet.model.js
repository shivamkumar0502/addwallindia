const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balance: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 }, // escrow me hai, release hone wala hai
    totalEarned: { type: Number, default: 0 },    // owner lifetime earnings
    totalSpent: { type: Number, default: 0 },     // client lifetime spend
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);
