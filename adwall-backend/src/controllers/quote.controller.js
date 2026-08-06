const Quote = require("../models/Quote.model");
const Booking = require("../models/Booking.model");
const User = require("../models/User.model");
const ApiResponse = require("../utils/apiResponse");
const notify = require("../services/notification.service");

const COMMISSION = parseFloat(process.env.PLATFORM_COMMISSION_PERCENT || 10) / 100;

// @route POST /api/quotes
const sendQuote = async (req, res) => {
  try {
    const { bookingId, amount, message, validDays = 3 } = req.body;
    const booking = await Booking.findById(bookingId).populate("client");
    if (!booking) return res.status(404).json(new ApiResponse(404, null, "Booking not found"));
    if (booking.owner.toString() !== req.user.id) return res.status(403).json(new ApiResponse(403, null, "Access denied"));

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + parseInt(validDays));

    const quote = await Quote.create({
      booking: bookingId, hoarding: booking.hoarding,
      owner: req.user.id, client: booking.client._id,
      amount, message, validUntil,
    });

    booking.status = "quote_received";
    await booking.save();

    const owner = await User.findById(req.user.id);
    // 🔔 Client ko notify karo — quote aaya
    notify.notifyQuoteReceived(quote, booking.client, owner).catch(console.error);

    return res.status(201).json(new ApiResponse(201, quote, "Quote sent"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @route POST /api/quotes/:id/accept
const acceptQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json(new ApiResponse(404, null, "Quote not found"));
    if (quote.client.toString() !== req.user.id) return res.status(403).json(new ApiResponse(403, null, "Access denied"));
    if (new Date() > quote.validUntil) {
      quote.status = "expired"; await quote.save();
      return res.status(400).json(new ApiResponse(400, null, "Quote expire ho gaya"));
    }

    quote.status = "accepted";
    await quote.save();

    const booking = await Booking.findById(quote.booking);
    booking.status = "confirmed";
    booking.pricing.baseAmount = quote.amount;
    booking.pricing.platformFee = Math.round(quote.amount * COMMISSION);
    booking.pricing.gst = Math.round(booking.pricing.platformFee * 0.18);
    booking.pricing.totalAmount = quote.amount + booking.pricing.platformFee + booking.pricing.gst;
    booking.pricing.ownerPayout = quote.amount - Math.round(quote.amount * COMMISSION);
    await booking.save();

    const [client, owner] = await Promise.all([User.findById(quote.client), User.findById(quote.owner)]);
    // 🔔 Owner ko notify karo — quote accepted
    notify.notifyQuoteAccepted(quote, booking, client, owner).catch(console.error);

    return res.status(200).json(new ApiResponse(200, { quote, booking }, "Quote accepted! Ab payment karo."));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @route POST /api/quotes/:id/reject
const rejectQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote || quote.client.toString() !== req.user.id) return res.status(404).json(new ApiResponse(404, null, "Quote not found"));
    quote.status = "rejected";
    await quote.save();
    return res.status(200).json(new ApiResponse(200, quote, "Quote rejected"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @route POST /api/quotes/:id/counter
const counterOffer = async (req, res) => {
  try {
    const { amount, message } = req.body;
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json(new ApiResponse(404, null, "Quote not found"));
    const isClient = quote.client.toString() === req.user.id;
    const isOwner  = quote.owner.toString() === req.user.id;
    if (!isClient && !isOwner) return res.status(403).json(new ApiResponse(403, null, "Access denied"));
    quote.status = "counter_offered";
    quote.counterOffer = { amount, message, by: isClient ? "client" : "owner" };
    await quote.save();

    const notifyId = isClient ? quote.owner : quote.client;
    const other = await User.findById(notifyId);
    notify.createInAppNotification({ userId: notifyId, title: "Counter Offer!", message: `₹${amount} ka counter offer aaya.`, type: "quote" }).catch(console.error);
    notify.sendSMS(other.mobile, `AdWall: Counter offer aaya — ₹${amount}. App pe dekho.`).catch(console.error);

    return res.status(200).json(new ApiResponse(200, quote, "Counter offer sent"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @route GET /api/quotes/booking/:bookingId
const getQuotesByBooking = async (req, res) => {
  try {
    const quotes = await Quote.find({ booking: req.params.bookingId }).populate("owner","name avatar businessDetails rating").sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, quotes, "Quotes fetched"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

module.exports = { sendQuote, acceptQuote, rejectQuote, counterOffer, getQuotesByBooking };
