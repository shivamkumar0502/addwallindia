const Booking = require("../models/Booking.model");
const Hoarding = require("../models/Hoarding.model");
const User = require("../models/User.model");
const ApiResponse = require("../utils/apiResponse");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const notify = require("../services/notification.service");

const COMMISSION = parseFloat(process.env.PLATFORM_COMMISSION_PERCENT || 10) / 100;
const GST_RATE = 0.18;

const calcPricing = (base) => {
  const platformFee = Math.round(base * COMMISSION);
  const gst = Math.round(platformFee * GST_RATE);
  return {
    baseAmount: base,
    platformFee,
    gst,
    totalAmount: base + platformFee + gst,
    ownerPayout: base - Math.round(base * COMMISSION),
  };
};

// @route POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const { hoardingId, startDate, endDate, requirements } = req.body;
    const hoarding = await Hoarding.findById(hoardingId).populate("owner");
    if (!hoarding || hoarding.verificationStatus !== "verified")
      return res.status(404).json(new ApiResponse(404, null, "Hoarding not found ya verified nahi"));

    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000);
    if (days < 1) return res.status(400).json(new ApiResponse(400, null, "Invalid dates"));

    const base = Math.ceil((hoarding.pricing.perMonth / 30) * days);
    const booking = await Booking.create({
      client: req.user.id,
      owner: hoarding.owner._id,
      hoarding: hoardingId,
      startDate, endDate, requirements,
      pricing: calcPricing(base),
      status: "quote_requested",
    });

    const client = await User.findById(req.user.id);
    notify.notifyNewBooking(booking, client, hoarding.owner).catch(console.error);

    return res.status(201).json(new ApiResponse(201, booking, "Booking request create ho gayi"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @route GET /api/bookings/my
const getClientBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { client: req.user.id };
    if (status) query.status = status;
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate("hoarding", "title images location category")
        .populate("owner", "name avatar businessDetails")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Booking.countDocuments(query),
    ]);
    return res.status(200).json(new ApiResponse(200, { bookings, total }, "Bookings fetched"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @route GET /api/bookings/owner
const getOwnerBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { owner: req.user.id };
    if (status) query.status = status;
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate("hoarding", "title images location")
        .populate("client", "name email mobile avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Booking.countDocuments(query),
    ]);
    return res.status(200).json(new ApiResponse(200, { bookings, total }, "Owner bookings fetched"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @route GET /api/bookings/:id
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("hoarding")
      .populate("client", "name email mobile avatar")
      .populate("owner", "name email mobile businessDetails")
      .populate("agreementId")
      .populate("paymentId");

    if (!booking) return res.status(404).json(new ApiResponse(404, null, "Booking not found"));

    const uid = req.user.id;
    const isAllowed =
      booking.client._id.toString() === uid ||
      booking.owner._id.toString() === uid ||
      req.user.role === "admin";

    if (!isAllowed) return res.status(403).json(new ApiResponse(403, null, "Access denied"));

    return res.status(200).json(new ApiResponse(200, booking, "Booking fetched"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @route POST /api/bookings/:id/proof
const submitInstallationProof = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json(new ApiResponse(404, null, "Booking not found"));
    if (booking.owner.toString() !== req.user.id)
      return res.status(403).json(new ApiResponse(403, null, "Access denied"));
    if (booking.status !== "payment_done")
      return res.status(400).json(new ApiResponse(400, null, "Payment ke baad proof upload karo"));

    let imageUrls = [];
    if (req.files?.images) {
      const results = await Promise.all(req.files.images.map(f => uploadToCloudinary(f.buffer, "proofs")));
      imageUrls = results.map(r => r.secure_url);
    }

    booking.installationProof = { images: imageUrls, submittedAt: new Date() };
    booking.status = "proof_submitted";
    await booking.save();

    const [client, owner] = await Promise.all([
      User.findById(booking.client),
      User.findById(booking.owner),
    ]);
    notify.notifyProofSubmitted(booking, client, owner).catch(console.error);

    return res.status(200).json(new ApiResponse(200, booking, "Proof submitted"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @route POST /api/bookings/:id/approve
const approveInstallation = async (req, res) => {
  try {
    const { remarks } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json(new ApiResponse(404, null, "Booking not found"));
    if (booking.client.toString() !== req.user.id)
      return res.status(403).json(new ApiResponse(403, null, "Access denied"));
    if (booking.status !== "proof_submitted")
      return res.status(400).json(new ApiResponse(400, null, "Proof submit hone ke baad approve karo"));

    booking.clientApproval = { approved: true, approvedAt: new Date(), remarks };
    booking.status = "completed";
    await booking.save();

    // ══════════════════════════════════════════════════════════
    // ESCROW RELEASE — Owner + Admin dono ko paisa jata hai
    // ══════════════════════════════════════════════════════════
    const { releaseEscrow } = require("./payment.controller");
    const payment = await releaseEscrow(booking.paymentId, booking._id);

    // Hoarding totalBookings increment
    await Hoarding.findByIdAndUpdate(booking.hoarding, { $inc: { totalBookings: 1 } });

    const owner = await User.findById(booking.owner);
    if (payment) {
      notify.notifyPaymentReleased(payment, owner, booking).catch(console.error);
    }

    return res.status(200).json(new ApiResponse(200, booking, "Approved! Owner aur Admin dono ko payment release ho gayi."));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @route POST /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json(new ApiResponse(404, null, "Booking not found"));

    const isClient = booking.client.toString() === req.user.id;
    const isOwner  = booking.owner.toString() === req.user.id;
    if (!isClient && !isOwner) return res.status(403).json(new ApiResponse(403, null, "Access denied"));

    const cancellableStatuses = ["quote_requested", "quote_received", "confirmed", "payment_pending"];
    if (!cancellableStatuses.includes(booking.status))
      return res.status(400).json(new ApiResponse(400, null, "Is stage pe cancel nahi ho sakta"));

    booking.status = "cancelled";
    booking.cancelledBy = isClient ? "client" : "owner";
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();
    await booking.save();

    const [client, owner] = await Promise.all([
      User.findById(booking.client),
      User.findById(booking.owner),
    ]);
    notify.notifyCancellation(booking, isClient ? "client" : "owner", client, owner).catch(console.error);

    return res.status(200).json(new ApiResponse(200, booking, "Booking cancelled"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @route GET /api/bookings/admin/all
const adminGetAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate("client", "name email")
        .populate("owner", "name email")
        .populate("hoarding", "title location")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Booking.countDocuments(query),
    ]);
    return res.status(200).json(new ApiResponse(200, { bookings, total }, "All bookings fetched"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

module.exports = {
  createBooking, getClientBookings, getOwnerBookings, getBookingById,
  submitInstallationProof, approveInstallation, cancelBooking, adminGetAllBookings,
};
