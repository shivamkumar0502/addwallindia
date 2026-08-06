const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    hoarding: { type: mongoose.Schema.Types.ObjectId, ref: "Hoarding", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    amount: { type: Number, required: true },
    validUntil: { type: Date, required: true },
    message: { type: String, default: null }, // owner ka personal message

    status: {
      type: String,
      enum: ["sent", "accepted", "rejected", "expired", "counter_offered"],
      default: "sent",
    },

    // Counter offer (owner/client dono de sakte hain)
    counterOffer: {
      amount: { type: Number, default: null },
      by: { type: String, enum: ["client", "owner", null], default: null },
      message: { type: String, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quote", quoteSchema);
