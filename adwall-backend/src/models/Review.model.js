const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    hoarding: { type: mongoose.Schema.Types.ObjectId, ref: "Hoarding", required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: null },

    ownerReply: { type: String, default: null },
    ownerRepliedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
