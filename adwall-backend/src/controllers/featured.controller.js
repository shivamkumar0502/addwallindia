const Hoarding = require("../models/Hoarding.model");
const ApiResponse = require("../utils/apiResponse");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const FEATURED_PRICE = parseInt(process.env.FEATURED_PRICE_MONTHLY || "999");

// @desc   Featured listing ke liye payment order banao
// @route  POST /api/featured/create-order
// @access Private (owner)
const createFeaturedOrder = async (req, res) => {
  try {
    const { hoardingId, months = 1, badge = "premium" } = req.body;

    const hoarding = await Hoarding.findById(hoardingId);
    if (!hoarding) return res.status(404).json(new ApiResponse(404, null, "Hoarding not found"));
    if (hoarding.owner.toString() !== req.user.id)
      return res.status(403).json(new ApiResponse(403, null, "Ye hoarding aapki nahi hai"));
    if (hoarding.verificationStatus !== "verified")
      return res.status(400).json(new ApiResponse(400, null, "Pehle hoarding verify karwao"));

    const amount = FEATURED_PRICE * months;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `featured_${hoardingId}_${Date.now()}`,
      notes: { hoardingId, months, badge, ownerId: req.user.id },
    });

    return res.status(201).json(new ApiResponse(201, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      hoardingTitle: hoarding.title,
      months,
      badge,
      pricePerMonth: FEATURED_PRICE,
    }, "Featured order created"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   Featured payment verify + activate
// @route  POST /api/featured/verify
// @access Private (owner)
const verifyFeaturedPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, hoardingId, months, badge } = req.body;

    const crypto = require("crypto");
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature)
      return res.status(400).json(new ApiResponse(400, null, "Payment verification failed"));

    // Hoarding ko featured karo
    const featuredUntil = new Date();
    featuredUntil.setMonth(featuredUntil.getMonth() + parseInt(months));

    const hoarding = await Hoarding.findByIdAndUpdate(
      hoardingId,
      { isFeatured: true, featuredUntil, featuredBadge: badge },
      { new: true }
    );

    return res.status(200).json(new ApiResponse(200, hoarding, `Hoarding featured ho gayi! ${months} month(s) ke liye.`));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   Featured hoardings list (home page ke liye)
// @route  GET /api/featured
// @access Public
const getFeaturedHoardings = async (req, res) => {
  try {
    // Expired featured listings fix karo
    await Hoarding.updateMany(
      { isFeatured: true, featuredUntil: { $lt: new Date() } },
      { isFeatured: false, featuredBadge: null }
    );

    const featured = await Hoarding.find({
      isFeatured: true,
      verificationStatus: "verified",
      isActive: true,
    })
      .populate("owner", "name businessDetails")
      .select("title images location category pricing isFeatured featuredBadge rating totalReviews dimensions lighting")
      .limit(12)
      .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, featured, "Featured hoardings fetched"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   Admin — kisi bhi hoarding ko featured karo (free/manual)
// @route  PATCH /api/featured/:hoardingId/admin-set
// @access Private (admin)
const adminSetFeatured = async (req, res) => {
  try {
    const { isFeatured, months = 1, badge = "premium" } = req.body;

    const featuredUntil = new Date();
    featuredUntil.setMonth(featuredUntil.getMonth() + parseInt(months));

    const hoarding = await Hoarding.findByIdAndUpdate(
      req.params.hoardingId,
      {
        isFeatured,
        featuredBadge: isFeatured ? badge : null,
        featuredUntil: isFeatured ? featuredUntil : null,
      },
      { new: true }
    );

    if (!hoarding) return res.status(404).json(new ApiResponse(404, null, "Hoarding not found"));

    return res.status(200).json(new ApiResponse(200, hoarding, `Hoarding ${isFeatured ? "featured" : "unfeatured"} successfully`));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

module.exports = { createFeaturedOrder, verifyFeaturedPayment, getFeaturedHoardings, adminSetFeatured };
