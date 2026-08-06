const User = require("../models/User.model");
const ApiResponse = require("../utils/apiResponse");
const bcrypt = require("bcryptjs");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// @desc   Get my profile
// @route  GET /api/profile/me
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -refreshToken");
    if (!user) return res.status(404).json(new ApiResponse(404, null, "User not found"));
    return res.status(200).json(new ApiResponse(200, user, "Profile fetched"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   Update profile (name, mobile, business details)
// @route  PATCH /api/profile/update
const updateProfile = async (req, res) => {
  try {
    const { name, mobile, companyName, agencyName, address, gstNumber } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json(new ApiResponse(404, null, "User not found"));

    // Mobile uniqueness check (dusre user ka nahi hona chahiye)
    if (mobile && mobile !== user.mobile) {
      const exists = await User.findOne({ mobile, _id: { $ne: req.user.id } });
      if (exists) return res.status(409).json(new ApiResponse(409, null, "Mobile number already registered"));
    }

    if (name) user.name = name;
    if (mobile) user.mobile = mobile;

    // Owner business details
    if (user.role === "owner") {
      user.businessDetails = {
        companyName: companyName ?? user.businessDetails?.companyName,
        agencyName: agencyName ?? user.businessDetails?.agencyName,
        address: address ?? user.businessDetails?.address,
      };
      if (gstNumber) user.kycDocuments.gstNumber = gstNumber;
    }

    // Avatar upload (agar file aaya ho)
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "avatars");
      user.avatar = result.secure_url;
    }

    await user.save();
    const updated = await User.findById(req.user.id).select("-password -refreshToken");
    return res.status(200).json(new ApiResponse(200, updated, "Profile updated"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   Change password
// @route  PATCH /api/profile/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json(new ApiResponse(400, null, "Current aur new password dono required hain"));
    if (newPassword.length < 6)
      return res.status(400).json(new ApiResponse(400, null, "Password minimum 6 characters hona chahiye"));

    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json(new ApiResponse(404, null, "User not found"));

    // Google se signup kiya tha to password nahi hai
    if (user.authProvider === "google" && !user.password)
      return res.status(400).json(new ApiResponse(400, null, "Google account me password nahi hota. Google se login karo."));

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json(new ApiResponse(401, null, "Current password galat hai"));

    const salt = await require("bcryptjs").genSalt(10);
    user.password = await require("bcryptjs").hash(newPassword, salt);
    await user.save();

    return res.status(200).json(new ApiResponse(200, null, "Password successfully changed!"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   Delete account
// @route  DELETE /api/profile/delete
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json(new ApiResponse(404, null, "User not found"));

    if (user.authProvider === "local") {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) return res.status(401).json(new ApiResponse(401, null, "Password galat hai"));
    }

    await User.findByIdAndDelete(req.user.id);
    return res.status(200).json(new ApiResponse(200, null, "Account deleted successfully"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

module.exports = { getProfile, updateProfile, changePassword, deleteAccount };
