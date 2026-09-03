//

const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const ApiResponse = require("../utils/apiResponse");

// FIX: auth.controller ab token me sirf { id } daalta hai (role nahi).
// Isliye req.user.role undefined tha -> authorize() har role-protected
// route pe 403 de raha tha. Ab role token se ya DB se dono jagah se milega.
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json(new ApiResponse(401, null, "Not authorized, token missing"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    let role = decoded.role;

    // Purane/naye dono tarah ke token support karo
    if (!role) {
      const user = await User.findById(decoded.id).select("role kycStatus name email");
      if (!user) {
        return res.status(401).json(new ApiResponse(401, null, "User not found"));
      }
      req.user = {
        id: String(user._id),
        _id: user._id,
        role: user.role,
        kycStatus: user.kycStatus,
        name: user.name,
        email: user.email,
      };
      return next();
    }

    req.user = { id: decoded.id, _id: decoded.id, role };
    next();
  } catch (error) {
    return res
      .status(401)
      .json(new ApiResponse(401, null, "Not authorized, token invalid or expired"));
  }
};

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
    return res
      .status(403)
      .json(new ApiResponse(403, null, "You do not have permission to access this resource"));
  }
  next();
};

module.exports = { protect, authorize };