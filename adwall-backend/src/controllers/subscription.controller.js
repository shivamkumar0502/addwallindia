const { Subscription, PLANS } = require("../models/Subscription.model");
const ApiResponse = require("../utils/apiResponse");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User.model");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc   Available plans dekho
// @route  GET /api/subscriptions/plans
// @access Public
const getPlans = async (req, res) => {
  return res.status(200).json(new ApiResponse(200, PLANS, "Plans fetched"));
};

// @desc   Meri current subscription
// @route  GET /api/subscriptions/me
// @access Private (owner)
const getMySubscription = async (req, res) => {
  try {
    let sub = await Subscription.findOne({ owner: req.user.id });
    if (!sub) {
      sub = await Subscription.create({ owner: req.user.id, plan: "free" });
    }
    return res.status(200).json(new ApiResponse(200, { ...sub.toObject(), planDetails: PLANS[sub.plan] }, "Subscription fetched"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   Plan upgrade karo — payment order banao
// @route  POST /api/subscriptions/upgrade
// @access Private (owner)
const createUpgradeOrder = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!["pro", "business"].includes(plan))
      return res.status(400).json(new ApiResponse(400, null, "Invalid plan. Choose 'pro' or 'business'"));

    const planDetails = PLANS[plan];
    const order = await razorpay.orders.create({
      amount: planDetails.price * 100,
      currency: "INR",
      receipt: `sub_${req.user.id}_${Date.now()}`,
      notes: { plan, ownerId: req.user.id },
    });

    return res.status(201).json(new ApiResponse(201, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan,
      planDetails,
    }, "Subscription order created"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   Subscription payment verify + activate
// @route  POST /api/subscriptions/verify
// @access Private (owner)
const verifySubscription = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature)
      return res.status(400).json(new ApiResponse(400, null, "Payment verification failed"));

    const planDetails = PLANS[plan];
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    let sub = await Subscription.findOne({ owner: req.user.id });
    if (!sub) sub = new Subscription({ owner: req.user.id });

    // History mein add karo
    sub.history.push({
      plan: sub.plan,
      from: sub.startDate,
      to: new Date(),
      amount: planDetails.price,
      paymentId: razorpay_payment_id,
    });

    sub.plan = plan;
    sub.status = "active";
    sub.startDate = new Date();
    sub.endDate = endDate;
    sub.razorpayPaymentId = razorpay_payment_id;
    await sub.save();

    return res.status(200).json(new ApiResponse(200, {
      ...sub.toObject(),
      planDetails,
    }, `${planDetails.name} plan activate ho gaya! 🎉`));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   Admin — sabhi subscriptions
// @route  GET /api/subscriptions/admin/all
// @access Private (admin)
const adminGetSubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find()
      .populate("owner", "name email mobile")
      .sort({ updatedAt: -1 });

    const summary = {
      free: subs.filter(s => s.plan === "free").length,
      pro: subs.filter(s => s.plan === "pro").length,
      business: subs.filter(s => s.plan === "business").length,
      totalRevenue: subs.reduce((sum, s) => sum + (PLANS[s.plan]?.price || 0), 0),
    };

    return res.status(200).json(new ApiResponse(200, { subs, summary }, "Subscriptions fetched"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

module.exports = { getPlans, getMySubscription, createUpgradeOrder, verifySubscription, adminGetSubscriptions };
