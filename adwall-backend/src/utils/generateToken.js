const jwt = require("jsonwebtoken");

// Access token - short lived (15 min), API requests authorize karne ke liye
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY }
  );
};

// Refresh token - long lived (7 days), naya access token lene ke liye use hota hai
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY }
  );
};

module.exports = { generateAccessToken, generateRefreshToken };
