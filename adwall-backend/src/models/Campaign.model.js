const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true },
    description: { type: String, default: null },

    // Requirements
    requirements: {
      cities: [{ type: String }],
      categories: [{ type: String }],
      budget: {
        min: { type: Number, default: null },
        max: { type: Number, required: true },
      },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      targetAudience: { type: String, default: null },
      additionalNotes: { type: String, default: null },
    },

    status: {
      type: String,
      enum: ["active", "closed", "cancelled"],
      default: "active",
    },

    // Quotes received from owners
    quotesReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quote" }],
    totalQuotes: { type: Number, default: 0 },

    // AI matched hoardings (ids store karenge)
    aiMatchedHoardings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hoarding" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Campaign", campaignSchema);
