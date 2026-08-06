const User = require("../models/User.model");
const Hoarding = require("../models/Hoarding.model");
const Booking = require("../models/Booking.model");
const ApiResponse = require("../utils/apiResponse");

// @desc   Admin - sabhi users dekho with filters
// @route  GET /api/admin/users
// @access Private (admin)
const getAllUsers = async (req, res) => {
  try {
    const { role, kycStatus, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (kycStatus) query.kycStatus = kycStatus;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -refreshToken")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    return res.status(200).json(new ApiResponse(200, { users, total, page: parseInt(page), totalPages: Math.ceil(total / limit) }, "Users fetched"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   Single user detail with stats
// @route  GET /api/admin/users/:id
// @access Private (admin)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -refreshToken");
    if (!user) return res.status(404).json(new ApiResponse(404, null, "User not found"));

    const stats = {};
    if (user.role === "owner") {
      stats.totalHoardings = await Hoarding.countDocuments({ owner: user._id });
      stats.totalBookings = await Booking.countDocuments({ owner: user._id });
    } else if (user.role === "client") {
      stats.totalBookings = await Booking.countDocuments({ client: user._id });
    }

    return res.status(200).json(new ApiResponse(200, { user, stats }, "User detail fetched"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

module.exports = { getAllUsers, getUserById };
