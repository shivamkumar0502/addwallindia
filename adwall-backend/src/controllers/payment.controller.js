const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment.model");
const Booking = require("../models/Booking.model");
const Wallet = require("../models/Wallet.model");
const Transaction = require("../models/Transaction.model");
const User = require("../models/User.model");
const ApiResponse = require("../utils/apiResponse");
const notify = require("../services/notification.service");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ── Wallet credit helper ── */
const creditWallet = async (userId, amount, category, description, reference, referenceModel) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) wallet = await Wallet.create({ user: userId });

  const before = wallet.balance;
  wallet.balance += amount;
  wallet.totalEarned = (wallet.totalEarned || 0) + amount;
  await wallet.save();

  await Transaction.create({
    wallet: wallet._id, user: userId,
    type: "credit", category,
    amount, balanceBefore: before, balanceAfter: wallet.balance,
    description, reference, referenceModel,
  });

  return wallet;
};

/* ── Wallet debit helper ── */
const debitWallet = async (userId, amount, category, description, reference, referenceModel) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) wallet = await Wallet.create({ user: userId });

  const before = wallet.balance;
  wallet.balance -= amount;
  wallet.totalSpent = (wallet.totalSpent || 0) + amount;
  await wallet.save();

  await Transaction.create({
    wallet: wallet._id, user: userId,
    type: "debit", category,
    amount, balanceBefore: before, balanceAfter: wallet.balance,
    description, reference, referenceModel,
  });

  return wallet;
};

// @desc   Razorpay order create karo
// @route  POST /api/payments/create-order
// @access Private (client)
const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json(new ApiResponse(404, null, "Booking not found"));
    if (booking.client.toString() !== req.user.id)
      return res.status(403).json(new ApiResponse(403, null, "Access denied"));
    if (booking.status !== "confirmed")
      return res.status(400).json(new ApiResponse(400, null, "Pehle quote accept karo"));

    // Razorpay order — amount paise me (×100)
    const order = await razorpay.orders.create({
      amount: booking.pricing.totalAmount * 100,
      currency: "INR",
      receipt: `booking_${bookingId}`,
      notes: { bookingId: bookingId.toString(), clientId: req.user.id },
    });

    // Payment record banao
    const payment = await Payment.create({
      booking: bookingId,
      client: req.user.id,
      owner: booking.owner,
      amount: booking.pricing.totalAmount,
      platformFee: booking.pricing.platformFee,
      ownerPayout: booking.pricing.ownerPayout,
      gst: booking.pricing.gst,
      razorpayOrderId: order.id,
    });

    booking.paymentId = payment._id;
    booking.status = "payment_pending";
    await booking.save();

    return res.status(201).json(new ApiResponse(201, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment._id,
      keyId: process.env.RAZORPAY_KEY_ID,
    }, "Razorpay order created"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   Payment verify + Escrow hold
// @route  POST /api/payments/verify
// @access Private (client)
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Signature verify — Razorpay ka genuine payment confirm karta hai
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature)
      return res.status(400).json(new ApiResponse(400, null, "Payment verification failed"));

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) return res.status(404).json(new ApiResponse(404, null, "Payment record not found"));

    // ── Escrow hold karo ──
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = "escrow_hold";
    payment.escrow.heldAt = new Date();
    await payment.save();

    // Booking status update
    const booking = await Booking.findById(payment.booking);
    booking.status = "payment_done";
    await booking.save();

    // ── Owner ke wallet me PENDING balance dikhao (actual credit baad me hoga) ──
    let ownerWallet = await Wallet.findOne({ user: payment.owner });
    if (!ownerWallet) ownerWallet = await Wallet.create({ user: payment.owner });
    ownerWallet.pendingBalance = (ownerWallet.pendingBalance || 0) + payment.ownerPayout;
    await ownerWallet.save();

    // ── Client wallet me debit record ──
    await debitWallet(
      payment.client, payment.amount,
      "booking_payment",
      `Booking #${booking._id} payment (Escrow)`,
      payment._id, "Payment"
    );

    const [client, owner] = await Promise.all([
      User.findById(payment.client),
      User.findById(payment.owner),
    ]);

    // 🔔 SMS + Email notifications
    notify.notifyPaymentDone(payment, booking, client, owner).catch(console.error);

    return res.status(200).json(new ApiResponse(200, payment, "Payment successful! Escrow mein safe hai."));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   Escrow Release — Client approval ke baad
//         Owner ko payout + Admin ko commission
// @route  POST /api/payments/:id/release  (booking controller se call hota hai)
const releaseEscrow = async (paymentId, bookingId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment || payment.status !== "escrow_hold") return;

  // ── 1. Owner ko payout credit ──
  await creditWallet(
    payment.owner, payment.ownerPayout,
    "owner_payout",
    `Booking #${bookingId} payout released`,
    bookingId, "Booking"
  );

  // ── 2. Owner ka pending balance clear karo ──
  const ownerWallet = await Wallet.findOne({ user: payment.owner });
  if (ownerWallet) {
    ownerWallet.pendingBalance = Math.max(0, (ownerWallet.pendingBalance || 0) - payment.ownerPayout);
    await ownerWallet.save();
  }

  // ── 3. Admin ko commission credit ──
  // Admin user dhundo (role: admin)
  const adminUser = await User.findOne({ role: "admin" });
  if (adminUser) {
    await creditWallet(
      adminUser._id,
      payment.platformFee, // yeh commission hai
      "platform_fee",
      `Commission from Booking #${bookingId}`,
      bookingId, "Booking"
    );
  }

  // ── 4. Payment status update ──
  payment.status = "released";
  payment.escrow.releasedAt = new Date();
  payment.escrow.releaseReason = "client_approved";
  await payment.save();

  return payment;
};

// @desc   Manual refund (admin)
// @route  POST /api/payments/:id/refund
// @access Private (admin)
const refundPayment = async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json(new ApiResponse(404, null, "Payment not found"));
    if (!["escrow_hold", "paid"].includes(payment.status))
      return res.status(400).json(new ApiResponse(400, null, "Refund eligible nahi hai"));

    // Razorpay refund
    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: payment.amount * 100,
      notes: { reason },
    });

    payment.status = "refunded";
    payment.refund = {
      razorpayRefundId: refund.id,
      amount: payment.amount,
      reason,
      refundedAt: new Date(),
    };
    await payment.save();

    // Owner ka pending balance clear karo
    const ownerWallet = await Wallet.findOne({ user: payment.owner });
    if (ownerWallet) {
      ownerWallet.pendingBalance = Math.max(0, (ownerWallet.pendingBalance || 0) - payment.ownerPayout);
      await ownerWallet.save();
    }

    // Client ko refund notification
    const client = await User.findById(payment.client);
    notify.sendEmail({
      to: client.email,
      subject: "Refund Initiated — AdWall India",
      html: `<p>Aapka ₹${payment.amount} refund 5-7 business days mein aapke account mein aa jayega.</p>`,
    }).catch(console.error);
    notify.sendSMS(client.mobile, `AdWall: ₹${payment.amount} ka refund initiate ho gaya. 5-7 din mein aa jayega.`).catch(console.error);

    return res.status(200).json(new ApiResponse(200, payment, "Refund initiated"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   Booking ka payment detail
// @route  GET /api/payments/booking/:bookingId
const getPaymentByBooking = async (req, res) => {
  try {
    const payment = await Payment.findOne({ booking: req.params.bookingId });
    if (!payment) return res.status(404).json(new ApiResponse(404, null, "Payment not found"));
    return res.status(200).json(new ApiResponse(200, payment, "Payment fetched"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   Admin — sabhi payments
// @route  GET /api/payments/admin/all
const adminGetAllPayments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("client", "name email")
        .populate("owner", "name email")
        .populate("booking", "startDate endDate")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Payment.countDocuments(query),
    ]);

    // Platform revenue summary
    const revenue = await Payment.aggregate([
      { $match: { status: { $in: ["escrow_hold", "released"] } } },
      { $group: { _id: null, total: { $sum: "$amount" }, commission: { $sum: "$platformFee" } } },
    ]);

    return res.status(200).json(new ApiResponse(200, {
      payments, total,
      summary: {
        totalGMV: revenue[0]?.total || 0,
        totalCommission: revenue[0]?.commission || 0,
      },
    }, "Payments fetched"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

module.exports = { createOrder, verifyPayment, releaseEscrow, refundPayment, getPaymentByBooking, adminGetAllPayments };
