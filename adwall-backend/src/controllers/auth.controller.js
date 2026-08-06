const User = require("../models/User.model");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");
const ApiResponse = require("../utils/apiResponse");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Cookie options - refresh token ko httpOnly cookie me bhejenge (XSS se safe rehta hai)
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 din
};

// @desc   Register new user (client ya owner)
// @route  POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, mobile, password, role } = req.body;

    // Basic validation
    if (!name || !email || !mobile || !password) {
      return res.status(400).json(new ApiResponse(400, null, "All fields are required"));
    }

    // Check duplicate email/mobile
    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return res.status(409).json(new ApiResponse(409, null, "User with this email or mobile already exists"));
    }

    // Role sirf client/owner allow karo signup se - admin manually DB me banega
    const allowedRole = role === "owner" ? "owner" : "client";

    const user = await User.create({
      name,
      email,
      mobile,
      password,
      role: allowedRole,
    });

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, cookieOptions);

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          user: { id: user._id, name: user.name, email: user.email, role: user.role },
          accessToken,
        },
        "Registration successful"
      )
    );
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
};

// @desc   Login user
// @route  POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(new ApiResponse(400, null, "Email and password are required"));
    }

    // password field select:false hai schema me, isliye explicitly +password lagana padega
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json(new ApiResponse(401, null, "Invalid email or password"));
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, cookieOptions);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user: { id: user._id, name: user.name, email: user.email, role: user.role, kycStatus: user.kycStatus },
          accessToken,
        },
        "Login successful"
      )
    );
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
};

// @desc   Get new access token using refresh token (cookie se aayega)
// @route  POST /api/auth/refresh
const refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (!incomingRefreshToken) {
      return res.status(401).json(new ApiResponse(401, null, "Refresh token missing, please login again"));
    }

    const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== incomingRefreshToken) {
      return res.status(401).json(new ApiResponse(401, null, "Invalid or expired refresh token"));
    }

    const newAccessToken = generateAccessToken(user._id, user.role);

    return res.status(200).json(new ApiResponse(200, { accessToken: newAccessToken }, "Token refreshed"));
  } catch (error) {
    return res.status(401).json(new ApiResponse(401, null, "Invalid refresh token, please login again"));
  }
};

// @desc   Logout - refresh token cookie clear karo aur DB se bhi hata do
// @route  POST /api/auth/logout
const logoutUser = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (incomingRefreshToken) {
      await User.findOneAndUpdate({ refreshToken: incomingRefreshToken }, { $set: { refreshToken: null } });
    }

    res.clearCookie("refreshToken", cookieOptions);
    return res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
};

// @desc   Login/Register via Google (frontend se ID token aayega)
// @route  POST /api/auth/google
const googleLogin = async (req, res) => {
  try {
    const { idToken, role } = req.body; // role optional - sirf naye user ke first signup pe kaam aayega

    if (!idToken) {
      return res.status(400).json(new ApiResponse(400, null, "Google ID token is required"));
    }

    // Google ke saath token verify karo - ye confirm karta hai ki token genuine hai
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload(); // { email, name, picture, sub (googleId), ... }

    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email }] });

    if (user) {
      // Agar pehle local signup kiya tha isi email se, ab Google se login kar raha hai - link kar do
      if (!user.googleId) {
        user.googleId = payload.sub;
        user.authProvider = "google";
        user.avatar = user.avatar || payload.picture;
        await user.save();
      }
    } else {
      // Naya user - mobile yahan nahi milega Google se, isliye placeholder rakh denge,
      // frontend baad me "complete profile" step me mobile maangega
      user = await User.create({
        name: payload.name,
        email: payload.email,
        mobile: `pending_${payload.sub}`, // temporary unique value, profile complete hone pe update hoga
        authProvider: "google",
        googleId: payload.sub,
        avatar: payload.picture,
        role: role === "owner" ? "owner" : "client",
        isVerified: true, // Google ne already email verify kar diya hai
      });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, cookieOptions);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
          accessToken,
          profileIncomplete: user.mobile.startsWith("pending_"), // frontend isko dekh ke mobile maang sakta hai
        },
        "Google login successful"
      )
    );
  } catch (error) {
    return res.status(401).json(new ApiResponse(401, null, "Invalid Google token: " + error.message));
  }
};

module.exports = { registerUser, loginUser, refreshAccessToken, logoutUser, googleLogin };
