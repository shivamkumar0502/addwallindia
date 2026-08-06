const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true }, // email ya mobile
    otp: { type: String, required: true },
    type: { type: String, enum: ["password_reset", "mobile_verify", "email_verify"], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    expiresAt: { type: Date, required: true },
    isUsed: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 }, // wrong attempts track
  },
  { timestamps: true }
);

// Expire hone ke baad auto delete (MongoDB TTL index)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OTP", otpSchema);
