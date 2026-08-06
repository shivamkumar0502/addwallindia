const Booking = require("../models/Booking.model");
const Payment = require("../models/Payment.model");
const User = require("../models/User.model");
const Hoarding = require("../models/Hoarding.model");
const Review = require("../models/Review.model");
const ApiResponse = require("../utils/apiResponse");

// @desc   Admin dashboard stats
// @route  GET /api/analytics/admin
// @access Private (admin)
const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers, totalClients, totalOwners,
      totalHoardings, verifiedHoardings, pendingHoardings,
      totalBookings, completedBookings, activeBookings,
      payments, totalRevenue,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "client" }),
      User.countDocuments({ role: "owner" }),
      Hoarding.countDocuments(),
      Hoarding.countDocuments({ verificationStatus: "verified" }),
      Hoarding.countDocuments({ verificationStatus: "pending" }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "completed" }),
      Booking.countDocuments({ status: { $in: ["payment_done", "installed", "proof_submitted"] } }),
      Payment.find({ status: { $in: ["escrow_hold", "released"] } }).select("amount platformFee"),
      Payment.aggregate([
        { $match: { status: { $in: ["escrow_hold", "released"] } } },
        { $group: { _id: null, total: { $sum: "$amount" }, fees: { $sum: "$platformFee" } } },
      ]),
    ]);

    // Top cities (most hoardings)
    const topCities = await Hoarding.aggregate([
      { $match: { verificationStatus: "verified" } },
      { $group: { _id: "$location.city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Monthly bookings trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyBookings = await Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$pricing.totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Top performing hoardings
    const topHoardings = await Hoarding.find({ verificationStatus: "verified" })
      .sort({ totalBookings: -1 })
      .limit(5)
      .select("title location.city totalBookings rating images");

    return res.status(200).json(
      new ApiResponse(200, {
        overview: {
          totalUsers,
          totalClients,
          totalOwners,
          totalHoardings,
          verifiedHoardings,
          pendingHoardings,
          totalBookings,
          completedBookings,
          activeBookings,
          totalRevenue: totalRevenue[0]?.total || 0,
          platformRevenue: totalRevenue[0]?.fees || 0,
        },
        topCities,
        monthlyBookings,
        topHoardings,
      }, "Admin analytics fetched")
    );
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   Owner analytics (earnings, bookings)
// @route  GET /api/analytics/owner
// @access Private (owner)
const getOwnerAnalytics = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const [
      totalHoardings, activeHoardings,
      totalBookings, completedBookings,
      earnings
    ] = await Promise.all([
      Hoarding.countDocuments({ owner: ownerId }),
      Hoarding.countDocuments({ owner: ownerId, verificationStatus: "verified", isActive: true }),
      Booking.countDocuments({ owner: ownerId }),
      Booking.countDocuments({ owner: ownerId, status: "completed" }),
      Payment.aggregate([
        { $match: { owner: ownerId, status: "released" } },
        { $group: { _id: null, total: { $sum: "$ownerPayout" } } },
      ]),
    ]);

    // Monthly earnings last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyEarnings = await Payment.aggregate([
      { $match: { owner: ownerId, status: "released", createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          amount: { $sum: "$ownerPayout" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const hoardingPerformance = await Hoarding.find({ owner: ownerId })
      .select("title totalBookings views rating")
      .sort({ totalBookings: -1 });

    return res.status(200).json(
      new ApiResponse(200, {
        overview: {
          totalHoardings,
          activeHoardings,
          totalBookings,
          completedBookings,
          totalEarnings: earnings[0]?.total || 0,
        },
        monthlyEarnings,
        hoardingPerformance,
      }, "Owner analytics fetched")
    );
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   Client analytics (campaigns, spend)
// @route  GET /api/analytics/client
// @access Private (client)
const getClientAnalytics = async (req, res) => {
  try {
    const clientId = req.user.id;

    const [totalBookings, activeBookings, completedBookings, totalSpend] = await Promise.all([
      Booking.countDocuments({ client: clientId }),
      Booking.countDocuments({ client: clientId, status: { $in: ["payment_done", "installed", "proof_submitted"] } }),
      Booking.countDocuments({ client: clientId, status: "completed" }),
      Payment.aggregate([
        { $match: { client: clientId, status: { $in: ["escrow_hold", "released"] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    return res.status(200).json(
      new ApiResponse(200, {
        totalBookings,
        activeBookings,
        completedBookings,
        totalSpend: totalSpend[0]?.total || 0,
      }, "Client analytics fetched")
    );
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

module.exports = { getAdminStats, getOwnerAnalytics, getClientAnalytics };
