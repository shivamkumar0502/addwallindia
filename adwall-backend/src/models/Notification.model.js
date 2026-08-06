const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["booking", "payment", "kyc", "quote", "campaign", "review", "system"],
      default: "system",
    },
    isRead: { type: Boolean, default: false },
    reference: { type: mongoose.Schema.Types.ObjectId, default: null },
    referenceModel: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
