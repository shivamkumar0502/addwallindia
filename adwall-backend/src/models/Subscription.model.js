const mongoose = require("mongoose");

// Plan definitions (static config)
const PLANS = {
  free: {
    name: "Free",
    price: 0,
    hoardingLimit: 2,         // max listings
    featuredAllowed: false,
    analyticsAccess: false,
    prioritySupport: false,
    commissionPercent: 12,    // platform commission %
  },
  pro: {
    name: "Pro",
    price: 999,               // per month ₹
    hoardingLimit: 10,
    featuredAllowed: true,
    analyticsAccess: true,
    prioritySupport: false,
    commissionPercent: 10,
  },
  business: {
    name: "Business+",
    price: 2499,
    hoardingLimit: 999,       // unlimited
    featuredAllowed: true,
    analyticsAccess: true,
    prioritySupport: true,
    commissionPercent: 8,
  },
};

const subscriptionSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    plan: { type: String, enum: ["free", "pro", "business"], default: "free" },
    status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null }, // null = free plan (no expiry)
    razorpaySubscriptionId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    autoRenew: { type: Boolean, default: true },
    history: [{
      plan: String,
      from: Date,
      to: Date,
      amount: Number,
      paymentId: String,
    }],
  },
  { timestamps: true }
);

// Virtual — plan details nikalo
subscriptionSchema.virtual("planDetails").get(function () {
  return PLANS[this.plan] || PLANS.free;
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = { Subscription, PLANS };
