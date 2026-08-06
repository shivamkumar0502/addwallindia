const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: null },
    type: { type: String, enum: ["percent", "flat"], required: true },
    value: { type: Number, required: true }, // percent: 10 = 10%, flat: 500 = ₹500
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null }, // percent type ke liye cap
    usageLimit: { type: Number, default: null }, // null = unlimited
    usedCount: { type: Number, default: 0 },
    userLimit: { type: Number, default: 1 }, // ek user kitni baar use kar sakta hai
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    applicableFor: { type: String, enum: ["all", "client", "owner"], default: "client" },
    // Track who used
    usedBy: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, usedAt: { type: Date } }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
