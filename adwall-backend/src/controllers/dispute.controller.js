const Booking = require("../models/Booking.model");
const ApiResponse = require("../utils/apiResponse");
const notify = require("../services/notification.service");
const User = require("../models/User.model");

// Simple dispute model — bookings me status "disputed" set karo
// @route POST /api/disputes/:bookingId/raise
const raiseDispute = async (req, res) => {
  try {
    const { reason, description } = req.body;
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json(new ApiResponse(404, null, "Booking not found"));

    const isInvolved = booking.client.toString() === req.user.id || booking.owner.toString() === req.user.id;
    if (!isInvolved) return res.status(403).json(new ApiResponse(403, null, "Access denied"));

    const raisableStatuses = ["payment_done", "proof_submitted", "client_approved"];
    if (!raisableStatuses.includes(booking.status))
      return res.status(400).json(new ApiResponse(400, null, "Is stage pe dispute raise nahi ho sakta"));

    booking.status = "disputed";
    booking.dispute = { reason, description, raisedBy: req.user.id, raisedAt: new Date(), status: "open" };
    await booking.save();

    // Admin ko notify karo
    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      notify.createInAppNotification({
        userId: admin._id,
        title: "⚠️ Dispute Raised!",
        message: `Booking #${booking._id} pe dispute raise hua hai. Review karo.`,
        type: "system",
        reference: booking._id,
        referenceModel: "Booking",
      }).catch(console.error);
    }

    return res.status(200).json(new ApiResponse(200, booking, "Dispute raised. Admin review karega."));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @route PATCH /api/disputes/:bookingId/resolve (admin only)
const resolveDispute = async (req, res) => {
  try {
    const { resolution, winner } = req.body; // winner: "client" | "owner" | "split"
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking || booking.status !== "disputed")
      return res.status(404).json(new ApiResponse(404, null, "Disputed booking not found"));

    booking.dispute.status = "resolved";
    booking.dispute.resolution = resolution;
    booking.dispute.resolvedAt = new Date();
    booking.dispute.resolvedBy = req.user.id;
    booking.status = "completed";
    await booking.save();

    const [client, owner] = await Promise.all([
      User.findById(booking.client),
      User.findById(booking.owner),
    ]);

    // Notify both parties
    [client, owner].forEach(u => {
      notify.createInAppNotification({
        userId: u._id,
        title: "Dispute Resolved",
        message: `Booking #${booking._id} ka dispute resolve ho gaya. Resolution: ${resolution}`,
        type: "system",
        reference: booking._id,
        referenceModel: "Booking",
      }).catch(console.error);
      notify.sendEmail({
        to: u.email,
        subject: "Dispute Resolved — AdWall India",
        html: `<p>Aapke booking dispute ka resolution aa gaya hai.</p><p><strong>Resolution:</strong> ${resolution}</p>`,
      }).catch(console.error);
    });

    return res.status(200).json(new ApiResponse(200, booking, "Dispute resolved"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @route GET /api/disputes/admin/all (admin only)
const getAllDisputes = async (req, res) => {
  try {
    const disputes = await Booking.find({ status: "disputed" })
      .populate("client", "name email mobile")
      .populate("owner", "name email mobile")
      .populate("hoarding", "title location")
      .sort({ "dispute.raisedAt": -1 });
    return res.status(200).json(new ApiResponse(200, disputes, "Disputes fetched"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

module.exports = { raiseDispute, resolveDispute, getAllDisputes };
