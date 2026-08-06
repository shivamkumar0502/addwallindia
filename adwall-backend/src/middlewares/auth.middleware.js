const jwt = require("jsonwebtoken");
const ApiResponse = require("../utils/apiResponse");

// Access token verify karta hai - har protected route pe ye middleware lagega
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json(new ApiResponse(401, null, "Not authorized, token missing"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // decoded payload (id, role) ko request me attach kar do, aage controllers me use hoga
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json(new ApiResponse(401, null, "Not authorized, token invalid or expired"));
  }
};

// Role-based access - jaise sirf "admin" ya "owner" hi ek route access kar paaye
// Usage: router.get('/route', protect, authorize('admin'), controllerFn)
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(new ApiResponse(403, null, "You do not have permission to access this resource"));
    }
    next();
  };
};

module.exports = { protect, authorize };
