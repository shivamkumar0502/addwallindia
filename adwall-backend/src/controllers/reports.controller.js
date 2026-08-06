const Booking = require("../models/Booking.model");
const Payment = require("../models/Payment.model");
const User = require("../models/User.model");
const Hoarding = require("../models/Hoarding.model");
const ApiResponse = require("../utils/apiResponse");

// CSV row banane ka helper
const toCSV = (headers, rows) => {
  const escape = (val) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };
  const header = headers.map(escape).join(",");
  const body = rows.map(row => headers.map(h => escape(row[h] ?? row[h.toLowerCase()])).join(",")).join("\n");
  return `${header}\n${body}`;
};

// @desc   Bookings report export (CSV)
// @route  GET /api/reports/bookings?from=2026-01-01&to=2026-12-31&status=completed
// @access Private (admin)
const exportBookings = async (req, res) => {
  try {
    const { from, to, status } = req.query;
    const query = {};
    if (status) query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const bookings = await Booking.find(query)
      .populate("client", "name email mobile")
      .populate("owner", "name email mobile")
      .populate("hoarding", "title location.city category")
      .sort({ createdAt: -1 })
      .limit(5000);

    const rows = bookings.map(b => ({
      "Booking ID": b._id,
      "Client Name": b.client?.name,
      "Client Email": b.client?.email,
      "Client Mobile": b.client?.mobile,
      "Owner Name": b.owner?.name,
      "Owner Email": b.owner?.email,
      "Hoarding": b.hoarding?.title,
      "City": b.hoarding?.location?.city,
      "Category": b.hoarding?.category,
      "Start Date": b.startDate ? new Date(b.startDate).toLocaleDateString("en-IN") : "",
      "End Date": b.endDate ? new Date(b.endDate).toLocaleDateString("en-IN") : "",
      "Base Amount": b.pricing?.baseAmount,
      "Platform Fee": b.pricing?.platformFee,
      "GST": b.pricing?.gst,
      "Total Amount": b.pricing?.totalAmount,
      "Owner Payout": b.pricing?.ownerPayout,
      "Status": b.status,
      "Created At": new Date(b.createdAt).toLocaleDateString("en-IN"),
    }));

    const csv = toCSV(Object.keys(rows[0] || {}), rows);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=bookings_report_${Date.now()}.csv`);
    return res.send(csv);
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   Payments report export (CSV)
// @route  GET /api/reports/payments
// @access Private (admin)
const exportPayments = async (req, res) => {
  try {
    const { from, to, status } = req.query;
    const query = {};
    if (status) query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const payments = await Payment.find(query)
      .populate("client", "name email")
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .limit(5000);

    const rows = payments.map(p => ({
      "Payment ID": p._id,
      "Razorpay Order ID": p.razorpayOrderId,
      "Razorpay Payment ID": p.razorpayPaymentId,
      "Client": p.client?.name,
      "Client Email": p.client?.email,
      "Owner": p.owner?.name,
      "Owner Email": p.owner?.email,
      "Total Amount (₹)": p.amount,
      "Platform Fee (₹)": p.platformFee,
      "GST (₹)": p.gst,
      "Owner Payout (₹)": p.ownerPayout,
      "Status": p.status,
      "Escrow Held At": p.escrow?.heldAt ? new Date(p.escrow.heldAt).toLocaleDateString("en-IN") : "",
      "Released At": p.escrow?.releasedAt ? new Date(p.escrow.releasedAt).toLocaleDateString("en-IN") : "",
      "Payment Method": p.method || "",
      "Date": new Date(p.createdAt).toLocaleDateString("en-IN"),
    }));

    const csv = toCSV(Object.keys(rows[0] || {}), rows);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=payments_report_${Date.now()}.csv`);
    return res.send(csv);
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   Users report export
// @route  GET /api/reports/users
// @access Private (admin)
const exportUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};

    const users = await User.find(query).sort({ createdAt: -1 }).limit(5000);

    const rows = users.map(u => ({
      "User ID": u._id,
      "Name": u.name,
      "Email": u.email,
      "Mobile": u.mobile?.startsWith("pending_") ? "" : u.mobile,
      "Role": u.role,
      "KYC Status": u.kycStatus,
      "Auth Provider": u.authProvider,
      "Verified": u.isVerified ? "Yes" : "No",
      "Company": u.businessDetails?.companyName || "",
      "Agency": u.businessDetails?.agencyName || "",
      "Joined": new Date(u.createdAt).toLocaleDateString("en-IN"),
    }));

    const csv = toCSV(Object.keys(rows[0] || {}), rows);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=users_report_${Date.now()}.csv`);
    return res.send(csv);
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   Hoardings report
// @route  GET /api/reports/hoardings
// @access Private (admin)
const exportHoardings = async (req, res) => {
  try {
    const hoardings = await Hoarding.find()
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .limit(5000);

    const rows = hoardings.map(h => ({
      "Hoarding ID": h._id,
      "Title": h.title,
      "Category": h.category,
      "City": h.location?.city,
      "Area": h.location?.area,
      "Owner": h.owner?.name,
      "Owner Email": h.owner?.email,
      "Width (ft)": h.dimensions?.width,
      "Height (ft)": h.dimensions?.height,
      "Lighting": h.lighting,
      "Traffic": h.dailyTraffic,
      "Monthly Price (₹)": h.pricing?.perMonth,
      "Rating": h.rating,
      "Total Reviews": h.totalReviews,
      "Total Bookings": h.totalBookings,
      "Views": h.views,
      "Verification": h.verificationStatus,
      "Featured": h.isFeatured ? "Yes" : "No",
      "Created": new Date(h.createdAt).toLocaleDateString("en-IN"),
    }));

    const csv = toCSV(Object.keys(rows[0] || {}), rows);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=hoardings_report_${Date.now()}.csv`);
    return res.send(csv);
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   Summary report (JSON — dashboard ke liye)
// @route  GET /api/reports/summary
// @access Private (admin)
const getSummaryReport = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear = new Date(`${year}-12-31T23:59:59`);

    const monthlyData = await Payment.aggregate([
      { $match: { status: { $in: ["escrow_hold", "released"] }, createdAt: { $gte: startOfYear, $lte: endOfYear } } },
      { $group: {
        _id: { month: { $month: "$createdAt" } },
        totalRevenue: { $sum: "$amount" },
        totalCommission: { $sum: "$platformFee" },
        count: { $sum: 1 },
      }},
      { $sort: { "_id.month": 1 } },
    ]);

    const [totalUsers, totalOwners, totalHoardings, totalBookings] = await Promise.all([
      User.countDocuments({ role: "client" }),
      User.countDocuments({ role: "owner" }),
      Hoarding.countDocuments({ verificationStatus: "verified" }),
      Booking.countDocuments({ status: "completed" }),
    ]);

    return res.status(200).json(new ApiResponse(200, {
      year: parseInt(year),
      monthlyData,
      totals: { totalUsers, totalOwners, totalHoardings, totalBookings },
    }, "Summary report fetched"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

module.exports = { exportBookings, exportPayments, exportUsers, exportHoardings, getSummaryReport };
