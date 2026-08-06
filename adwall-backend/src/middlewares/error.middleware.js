const ApiResponse = require("../utils/apiResponse");

// Express ka global error handler - app.js me sabse last me lagana hai
// Koi bhi controller me agar try-catch miss ho gaya ya next(err) call hua, ye yahan aayega
const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json(new ApiResponse(statusCode, null, message));
};

// 404 - jab koi route match hi na ho
const notFound = (req, res, next) => {
  return res.status(404).json(new ApiResponse(404, null, `Route not found: ${req.originalUrl}`));
};

module.exports = { errorHandler, notFound };
