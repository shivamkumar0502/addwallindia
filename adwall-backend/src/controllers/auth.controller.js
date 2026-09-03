// const User = require("../models/User.model");
// const ApiResponse = require("../utils/apiResponse");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");

// // ── Cross-domain cookie options ──
// const getCookieOptions = () => ({
//   httpOnly: true,
//   secure: process.env.NODE_ENV === "production",
//   sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
//   maxAge: 7 * 24 * 60 * 60 * 1000,
//   path: "/",
// });

// // ── Token generate karo ──
// const generateTokens = (userId) => {
//   const accessToken = jwt.sign(
//     { id: userId },
//     process.env.JWT_ACCESS_SECRET,
//     { expiresIn: "15m" }
//   );
//   const refreshToken = jwt.sign(
//     { id: userId },
//     process.env.JWT_REFRESH_SECRET,
//     { expiresIn: "7d" }
//   );
//   return { accessToken, refreshToken };
// };

// // ── User data format karo (consistent response) ──
// const formatUser = (user) => ({
//   _id: user._id,
//   name: user.name,
//   email: user.email,
//   role: user.role,
//   avatar: user.avatar || null,
//   kycStatus: user.kycStatus || "not_submitted",
//   mobile: user.mobile?.startsWith("pending_") ? null : user.mobile,
//   authProvider: user.authProvider,
//   isVerified: user.isVerified,
// });

// // @route POST /api/auth/register
// const register = async (req, res) => {
//   try {
//     const { name, email, password, role, mobile } = req.body;

//     if (!name || !email || !password || !role)
//       return res.status(400).json(new ApiResponse(400, null, "Name, email, password aur role required hain"));

//     if (!["client", "owner"].includes(role))
//       return res.status(400).json(new ApiResponse(400, null, "Role 'client' ya 'owner' hona chahiye"));

//     if (password.length < 6)
//       return res.status(400).json(new ApiResponse(400, null, "Password minimum 6 characters hona chahiye"));

//     const existing = await User.findOne({ email: email.toLowerCase().trim() });
//     if (existing)
//       return res.status(409).json(new ApiResponse(409, null, "Is email se account pehle se exist karta hai"));

//     const user = await User.create({
//       name: name.trim(),
//       email: email.toLowerCase().trim(),
//       password,
//       role,
//       mobile: mobile || `pending_${Date.now()}`,
//       authProvider: "local",
//     });

//     const { accessToken, refreshToken } = generateTokens(user._id);
//     user.refreshToken = refreshToken;
//     await user.save();

//     res.cookie("refreshToken", refreshToken, getCookieOptions());

//     return res.status(201).json(new ApiResponse(201, {
//       user: formatUser(user),
//       accessToken,
//       refreshToken, // Frontend ke liye localStorage backup
//     }, "Account create ho gaya! Welcome to AdWall India 🎉"));
//   } catch (err) {
//     console.error("Register error:", err);
//     return res.status(500).json(new ApiResponse(500, null, err.message));
//   }
// };

// // @route POST /api/auth/login
// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password)
//       return res.status(400).json(new ApiResponse(400, null, "Email aur password required hain"));

//     const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

//     if (!user)
//       return res.status(401).json(new ApiResponse(401, null, "Email ya password galat hai"));

//     if (user.authProvider === "google" && !user.password)
//       return res.status(401).json(new ApiResponse(401, null, "Ye account Google se registered hai. Google button se login karo."));

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch)
//       return res.status(401).json(new ApiResponse(401, null, "Email ya password galat hai"));

//     const { accessToken, refreshToken } = generateTokens(user._id);
//     user.refreshToken = refreshToken;
//     await user.save();

//     res.cookie("refreshToken", refreshToken, getCookieOptions());

//     return res.status(200).json(new ApiResponse(200, {
//       user: formatUser(user),
//       accessToken,
//       refreshToken, // Frontend localStorage ke liye
//     }, `Welcome back, ${user.name}! 👋`));
//   } catch (err) {
//     console.error("Login error:", err);
//     return res.status(500).json(new ApiResponse(500, null, err.message));
//   }
// };

// // @route POST /api/auth/refresh
// const refreshToken = async (req, res) => {
//   try {
//     // Cookie ya body/header se token lo
//     const token =
//       req.cookies?.refreshToken ||
//       req.body?.refreshToken ||
//       req.headers["x-refresh-token"];

//     if (!token)
//       return res.status(401).json(new ApiResponse(401, null, "Session expire ho gaya. Dobara login karo."));

//     const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
//     const user = await User.findById(decoded.id).select("+refreshToken");

//     if (!user || user.refreshToken !== token)
//       return res.status(401).json(new ApiResponse(401, null, "Invalid session. Dobara login karo."));

//     const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
//     user.refreshToken = newRefreshToken;
//     await user.save();

//     res.cookie("refreshToken", newRefreshToken, getCookieOptions());

//     return res.status(200).json(new ApiResponse(200, {
//       user: formatUser(user),
//       accessToken,
//       refreshToken: newRefreshToken,
//     }, "Token refreshed"));
//   } catch (err) {
//     return res.status(401).json(new ApiResponse(401, null, "Session expire ho gaya. Dobara login karo."));
//   }
// };

// // @route POST /api/auth/logout
// const logout = async (req, res) => {
//   try {
//     if (req.user?.id)
//       await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
//     res.clearCookie("refreshToken", { ...getCookieOptions(), maxAge: 0 });
//     return res.status(200).json(new ApiResponse(200, null, "Logout successful"));
//   } catch (err) {
//     return res.status(500).json(new ApiResponse(500, null, err.message));
//   }
// };

// // @route GET /api/auth/me — Current user info
// const getMe = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select("-password -refreshToken");
//     if (!user) return res.status(404).json(new ApiResponse(404, null, "User not found"));
//     return res.status(200).json(new ApiResponse(200, formatUser(user), "User fetched"));
//   } catch (err) {
//     return res.status(500).json(new ApiResponse(500, null, err.message));
//   }
// };

// // @route POST /api/auth/google — Google OAuth token verify
// const googleLogin = async (req, res) => {
//   try {
//     const { token } = req.body;
//     if (!token) return res.status(400).json(new ApiResponse(400, null, "Google token required"));

//     // Google token verify karo
//     const { OAuth2Client } = require("google-auth-library");
//     const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//     const ticket = await client.verifyIdToken({
//       idToken: token,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });

//     const payload = ticket.getPayload();
//     const { email, name, picture, sub: googleId } = payload;

//     let user = await User.findOne({ email });

//     if (!user) {
//       // Naya user — role poochna padega (register flow)
//       return res.status(200).json(new ApiResponse(200, {
//         isNewUser: true,
//         googleData: { email, name, picture, googleId },
//       }, "Google verified. Role select karo."));
//     }

//     // Existing user — login karo
//     if (user.authProvider === "local") {
//       user.authProvider = "google";
//       user.googleId = googleId;
//       user.avatar = user.avatar || picture;
//     }

//     const { accessToken, refreshToken } = generateTokens(user._id);
//     user.refreshToken = refreshToken;
//     await user.save();

//     res.cookie("refreshToken", refreshToken, getCookieOptions());

//     return res.status(200).json(new ApiResponse(200, {
//       user: formatUser(user),
//       accessToken,
//       refreshToken,
//       isNewUser: false,
//     }, `Welcome, ${user.name}!`));
//   } catch (err) {
//     console.error("Google login error:", err);
//     return res.status(401).json(new ApiResponse(401, null, "Google authentication failed"));
//   }
// };

// // @route POST /api/auth/google/complete — Google new user ka role set karo
// const googleComplete = async (req, res) => {
//   try {
//     const { email, name, picture, googleId, role } = req.body;

//     if (!email || !role || !["client", "owner"].includes(role))
//       return res.status(400).json(new ApiResponse(400, null, "Email aur valid role required hai"));

//     const existing = await User.findOne({ email });
//     if (existing)
//       return res.status(409).json(new ApiResponse(409, null, "Account pehle se exist karta hai"));

//     const user = await User.create({
//       name,
//       email,
//       role,
//       avatar: picture,
//       googleId,
//       authProvider: "google",
//       mobile: `pending_${Date.now()}`,
//       isVerified: true,
//     });

//     const { accessToken, refreshToken } = generateTokens(user._id);
//     user.refreshToken = refreshToken;
//     await user.save();

//     res.cookie("refreshToken", refreshToken, getCookieOptions());

//     return res.status(201).json(new ApiResponse(201, {
//       user: formatUser(user),
//       accessToken,
//       refreshToken,
//     }, "Account create ho gaya! Welcome to AdWall India 🎉"));
//   } catch (err) {
//     return res.status(500).json(new ApiResponse(500, null, err.message));
//   }
// };

// module.exports = {
//   register,
//   login,
//   refreshToken,
//   logout,
//   getMe,
//   googleLogin,
//   googleComplete,
// };

const User = require("../models/User.model");
const ApiResponse = require("../utils/apiResponse");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// ── Cross-domain cookie options ──
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

// ── Token generate karo ──
const generateTokens = (userId, role) => {
  // FIX: role bhi token me daalo — authorize() middleware ise use karta hai
  const accessToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
};

// ── User data format karo (consistent response) ──
const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar || null,
  kycStatus: user.kycStatus || "pending",
  mobile: user.mobile?.startsWith("pending_") ? null : user.mobile,
  authProvider: user.authProvider,
  isVerified: user.isVerified,
});

// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, mobile, verifyToken } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json(new ApiResponse(400, null, "Name, email, password aur role required hain"));

    // ── OTP verification compulsory (naya) ──
    // /api/otp/verify-register-otp se mila hua short-lived token check karo.
    // Isse koi bina email+mobile verify kiye account nahi bana sakta.
    if (!verifyToken)
      return res.status(400).json(
        new ApiResponse(400, null, "Pehle email aur mobile OTP verify karo")
      );

    let verified;
    try {
      verified = jwt.verify(verifyToken, process.env.JWT_ACCESS_SECRET);
    } catch {
      return res.status(400).json(
        new ApiResponse(400, null, "Verification expire ho gaya. Dobara OTP bhejo.")
      );
    }

    if (verified.purpose !== "register")
      return res.status(400).json(new ApiResponse(400, null, "Invalid verification token"));

    if (verified.email !== email.toLowerCase().trim())
      return res.status(400).json(
        new ApiResponse(400, null, "Email verification se match nahi kar raha")
      );

    if (mobile && verified.mobile !== mobile.trim())
      return res.status(400).json(
        new ApiResponse(400, null, "Mobile verification se match nahi kar raha")
      );

    // User ne jis channel pe OTP verify kiya, sirf wahi "verified" hai
    const verifiedViaMobile = verified.channel === "mobile";

    if (!["client", "owner"].includes(role))
      return res.status(400).json(new ApiResponse(400, null, "Role 'client' ya 'owner' hona chahiye"));

    if (password.length < 6)
      return res.status(400).json(new ApiResponse(400, null, "Password minimum 6 characters hona chahiye"));

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing)
      return res.status(409).json(new ApiResponse(409, null, "Is email se account pehle se exist karta hai"));

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      mobile: verified.mobile,
      authProvider: "local",
      isVerified: true,
      emailVerified: !verifiedViaMobile,
      mobileVerified: verifiedViaMobile,
    });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, getCookieOptions());

    return res.status(201).json(new ApiResponse(201, {
      user: formatUser(user),
      accessToken,
      refreshToken, // Frontend ke liye localStorage backup
    }, "Account create ho gaya! Welcome to AdWall India 🎉"));
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json(new ApiResponse(400, null, "Email aur password required hain"));

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

    if (!user)
      return res.status(401).json(new ApiResponse(401, null, "Email ya password galat hai"));

    if (user.authProvider === "google" && !user.password)
      return res.status(401).json(new ApiResponse(401, null, "Ye account Google se registered hai. Google button se login karo."));

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json(new ApiResponse(401, null, "Email ya password galat hai"));

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, getCookieOptions());

    return res.status(200).json(new ApiResponse(200, {
      user: formatUser(user),
      accessToken,
      refreshToken, // Frontend localStorage ke liye
    }, `Welcome back, ${user.name}! 👋`));
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @route POST /api/auth/refresh
const refreshToken = async (req, res) => {
  try {
    // Cookie ya body/header se token lo
    const token =
      req.cookies?.refreshToken ||
      req.body?.refreshToken ||
      req.headers["x-refresh-token"];

    if (!token)
      return res.status(401).json(new ApiResponse(401, null, "Session expire ho gaya. Dobara login karo."));

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== token)
      return res.status(401).json(new ApiResponse(401, null, "Invalid session. Dobara login karo."));

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.role);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie("refreshToken", newRefreshToken, getCookieOptions());

    return res.status(200).json(new ApiResponse(200, {
      user: formatUser(user),
      accessToken,
      refreshToken: newRefreshToken,
    }, "Token refreshed"));
  } catch (err) {
    return res.status(401).json(new ApiResponse(401, null, "Session expire ho gaya. Dobara login karo."));
  }
};

// @route POST /api/auth/logout
const logout = async (req, res) => {
  try {
    if (req.user?.id)
      await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    res.clearCookie("refreshToken", { ...getCookieOptions(), maxAge: 0 });
    return res.status(200).json(new ApiResponse(200, null, "Logout successful"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @route GET /api/auth/me — Current user info
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -refreshToken");
    if (!user) return res.status(404).json(new ApiResponse(404, null, "User not found"));
    return res.status(200).json(new ApiResponse(200, formatUser(user), "User fetched"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @route POST /api/auth/google — Google OAuth token verify
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json(new ApiResponse(400, null, "Google token required"));

    // Google token verify karo
    const { OAuth2Client } = require("google-auth-library");
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Naya user — role poochna padega (register flow)
      return res.status(200).json(new ApiResponse(200, {
        isNewUser: true,
        googleData: { email, name, picture, googleId },
      }, "Google verified. Role select karo."));
    }

    // Existing user — login karo
    // FIX: local account ka provider mat badlo, sirf googleId link karo
    if (!user.googleId) user.googleId = googleId;
    if (!user.avatar) user.avatar = picture;

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, getCookieOptions());

    return res.status(200).json(new ApiResponse(200, {
      user: formatUser(user),
      accessToken,
      refreshToken,
      isNewUser: false,
    }, `Welcome, ${user.name}!`));
  } catch (err) {
    console.error("Google login error:", err);
    return res.status(401).json(new ApiResponse(401, null, "Google authentication failed"));
  }
};

// @route POST /api/auth/google/complete — Google new user ka role set karo
const googleComplete = async (req, res) => {
  try {
    const { email, name, picture, googleId, role, mobile, verifyToken } = req.body;

    if (!email || !role || !["client", "owner"].includes(role))
      return res.status(400).json(new ApiResponse(400, null, "Email aur valid role required hai"));

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json(new ApiResponse(409, null, "Account pehle se exist karta hai"));

    // Google se email already verified hai. Mobile optional — agar diya hai
    // to uska OTP verifyToken bhi chahiye.
    let verifiedMobile;
    if (mobile) {
      if (!verifyToken)
        return res.status(400).json(new ApiResponse(400, null, "Mobile OTP verify karo"));
      try {
        const v = jwt.verify(verifyToken, process.env.JWT_ACCESS_SECRET);
        if (v.purpose !== "register" || v.mobile !== mobile.trim())
          throw new Error("mismatch");
        verifiedMobile = v.mobile;
      } catch {
        return res.status(400).json(
          new ApiResponse(400, null, "Mobile verification expire ya invalid hai")
        );
      }
    }

    const user = await User.create({
      name,
      email,
      role,
      avatar: picture,
      googleId,
      authProvider: "google",
      mobile: verifiedMobile,
      isVerified: true,
    });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, getCookieOptions());

    return res.status(201).json(new ApiResponse(201, {
      user: formatUser(user),
      accessToken,
      refreshToken,
    }, "Account create ho gaya! Welcome to AdWall India 🎉"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  googleLogin,
  googleComplete,
};