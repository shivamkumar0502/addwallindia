const Coupon = require("../models/Coupon.model");
const ApiResponse = require("../utils/apiResponse");

// @desc   Coupon validate karo (booking ke time)
// @route  POST /api/coupons/validate
// @access Private (client)
const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) return res.status(400).json(new ApiResponse(400, null, "Coupon code required hai"));

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon || !coupon.isActive)
      return res.status(404).json(new ApiResponse(404, null, "Invalid ya expired coupon code"));

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil)
      return res.status(400).json(new ApiResponse(400, null, "Coupon expired ho gaya hai"));

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
      return res.status(400).json(new ApiResponse(400, null, "Coupon limit exceed ho gayi hai"));

    if (orderAmount < coupon.minOrderAmount)
      return res.status(400).json(new ApiResponse(400, null, `Minimum order ₹${coupon.minOrderAmount} hona chahiye`));

    // User limit check
    const userUsage = coupon.usedBy.filter(u => u.user.toString() === req.user.id).length;
    if (userUsage >= coupon.userLimit)
      return res.status(400).json(new ApiResponse(400, null, "Aap pehle se ye coupon use kar chuke ho"));

    // Discount calculate karo
    let discount = 0;
    if (coupon.type === "percent") {
      discount = Math.round(orderAmount * coupon.value / 100);
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = Math.min(coupon.value, orderAmount);
    }

    const finalAmount = orderAmount - discount;

    return res.status(200).json(new ApiResponse(200, {
      couponId: coupon._id,
      code: coupon.code,
      description: coupon.description,
      discount,
      finalAmount,
      type: coupon.type,
      value: coupon.value,
    }, `Coupon applied! ₹${discount} off`));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   Coupon use mark karo (payment ke baad)
// @route  POST /api/coupons/apply
// @access Private
const applyCoupon = async (req, res) => {
  try {
    const { couponId } = req.body;
    const coupon = await Coupon.findById(couponId);
    if (!coupon) return res.status(404).json(new ApiResponse(404, null, "Coupon not found"));

    coupon.usedBy.push({ user: req.user.id, usedAt: new Date() });
    coupon.usedCount += 1;
    await coupon.save();

    return res.status(200).json(new ApiResponse(200, null, "Coupon applied"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// ── Admin CRUD ──

// @route GET /api/coupons/admin
const adminGetCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, coupons, "Coupons fetched"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @route POST /api/coupons/admin
const adminCreateCoupon = async (req, res) => {
  try {
    const { code, description, type, value, minOrderAmount, maxDiscount, usageLimit, userLimit, validFrom, validUntil } = req.body;

    const exists = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (exists) return res.status(409).json(new ApiResponse(409, null, "Ye coupon code pehle se exist karta hai"));

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      description, type, value,
      minOrderAmount: minOrderAmount || 0,
      maxDiscount: maxDiscount || null,
      usageLimit: usageLimit || null,
      userLimit: userLimit || 1,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
    });
    return res.status(201).json(new ApiResponse(201, coupon, "Coupon create ho gaya!"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @route PATCH /api/coupons/admin/:id/toggle
const adminToggleCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json(new ApiResponse(404, null, "Coupon not found"));
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    return res.status(200).json(new ApiResponse(200, coupon, `Coupon ${coupon.isActive ? "activated" : "deactivated"}`));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @route DELETE /api/coupons/admin/:id
const adminDeleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    return res.status(200).json(new ApiResponse(200, null, "Coupon deleted"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

module.exports = { validateCoupon, applyCoupon, adminGetCoupons, adminCreateCoupon, adminToggleCoupon, adminDeleteCoupon };
