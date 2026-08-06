const OTP = require("../models/OTP.model");
const User = require("../models/User.model");
const ApiResponse = require("../utils/apiResponse");
const bcrypt = require("bcryptjs");
const notify = require("../services/notification.service");

// 6-digit OTP generate karo
const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

// OTP expiry — 10 minutes
const getExpiry = () => new Date(Date.now() + 10 * 60 * 1000);

// @desc   Forgot password — email pe OTP bhejo
// @route  POST /api/otp/forgot-password
// @access Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json(new ApiResponse(400, null, "Email required hai"));

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json(new ApiResponse(404, null, "Is email pe koi account nahi hai"));

    if (user.authProvider === "google")
      return res.status(400).json(new ApiResponse(400, null, "Google account hai — Google se login karo"));

    // Purane OTPs delete karo
    await OTP.deleteMany({ identifier: email, type: "password_reset" });

    const otp = generateOTP();
    await OTP.create({
      identifier: email,
      otp,
      type: "password_reset",
      userId: user._id,
      expiresAt: getExpiry(),
    });

    // Email bhejo
    await notify.sendEmail({
      to: email,
      subject: "Password Reset OTP — AdWall India",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
          <div style="background:#f97316;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">AdWall India</h1>
          </div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:30px;text-align:center;">
            <h2 style="color:#111827;">Password Reset</h2>
            <p style="color:#6b7280;">Aapka OTP neeche hai:</p>
            <div style="background:#fff7ed;border:2px solid #fed7aa;border-radius:12px;padding:20px;margin:20px 0;">
              <p style="font-size:40px;font-weight:900;color:#f97316;letter-spacing:8px;margin:0;">${otp}</p>
            </div>
            <p style="color:#6b7280;font-size:14px;">Ye OTP <strong>10 minutes</strong> ke liye valid hai.</p>
            <p style="color:#9ca3af;font-size:12px;">Agar aapne request nahi kiya to ignore karein.</p>
          </div>
        </div>`,
    });

    // SMS bhi bhejo (agar mobile available hai)
    if (user.mobile && !user.mobile.startsWith("pending_")) {
      await notify.sendSMS(user.mobile, `AdWall: Password reset OTP hai ${otp}. 10 min mein expire hoga.`);
    }

    return res.status(200).json(new ApiResponse(200, { email: `${email.slice(0, 3)}***${email.slice(email.indexOf("@"))}` }, "OTP bhej diya! Email check karo."));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   OTP verify + new password set
// @route  POST /api/otp/reset-password
// @access Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json(new ApiResponse(400, null, "Email, OTP aur new password required hain"));
    if (newPassword.length < 6)
      return res.status(400).json(new ApiResponse(400, null, "Password minimum 6 characters hona chahiye"));

    const otpDoc = await OTP.findOne({ identifier: email, type: "password_reset", isUsed: false });

    if (!otpDoc) return res.status(400).json(new ApiResponse(400, null, "OTP invalid ya expired hai. Dobara request karo."));

    // Max 5 wrong attempts
    if (otpDoc.attempts >= 5) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(400).json(new ApiResponse(400, null, "Too many wrong attempts. Dobara OTP request karo."));
    }

    if (otpDoc.otp !== otp) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return res.status(400).json(new ApiResponse(400, null, `Wrong OTP. ${5 - otpDoc.attempts} attempts remaining.`));
    }

    if (new Date() > otpDoc.expiresAt) {
      return res.status(400).json(new ApiResponse(400, null, "OTP expire ho gaya. Dobara request karo."));
    }

    // Password update karo
    const user = await User.findById(otpDoc.userId);
    if (!user) return res.status(404).json(new ApiResponse(404, null, "User not found"));

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // OTP used mark karo
    otpDoc.isUsed = true;
    await otpDoc.save();

    return res.status(200).json(new ApiResponse(200, null, "Password successfully reset ho gaya! Ab login karo."));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   Mobile verification OTP bhejo
// @route  POST /api/otp/send-mobile-otp
// @access Private
const sendMobileOTP = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile))
      return res.status(400).json(new ApiResponse(400, null, "Valid 10-digit mobile number enter karo"));

    // Check if already taken by someone else
    const existingUser = await User.findOne({ mobile, _id: { $ne: req.user.id } });
    if (existingUser) return res.status(409).json(new ApiResponse(409, null, "Ye number kisi aur account se linked hai"));

    await OTP.deleteMany({ identifier: mobile, type: "mobile_verify" });

    const otp = generateOTP();
    await OTP.create({
      identifier: mobile,
      otp,
      type: "mobile_verify",
      userId: req.user.id,
      expiresAt: getExpiry(),
    });

    await notify.sendSMS(mobile, `AdWall: Aapka mobile verification OTP hai ${otp}. 10 min mein valid hai.`);

    // Development mein OTP return karo (production mein nahi!)
    const isDev = process.env.NODE_ENV === "development";

    return res.status(200).json(new ApiResponse(200,
      isDev ? { otp } : null,
      "OTP bhej diya! Mobile check karo."
    ));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   Mobile OTP verify karo
// @route  POST /api/otp/verify-mobile
// @access Private
const verifyMobileOTP = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) return res.status(400).json(new ApiResponse(400, null, "Mobile aur OTP required hain"));

    const otpDoc = await OTP.findOne({
      identifier: mobile, type: "mobile_verify",
      userId: req.user.id, isUsed: false,
    });

    if (!otpDoc) return res.status(400).json(new ApiResponse(400, null, "OTP invalid ya expired hai"));

    if (otpDoc.attempts >= 5) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(400).json(new ApiResponse(400, null, "Too many attempts. Dobara OTP bhejo."));
    }

    if (otpDoc.otp !== otp) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return res.status(400).json(new ApiResponse(400, null, `Wrong OTP. ${5 - otpDoc.attempts} attempts remaining.`));
    }

    if (new Date() > otpDoc.expiresAt)
      return res.status(400).json(new ApiResponse(400, null, "OTP expire ho gaya. Dobara bhejo."));

    // Mobile update + verify karo
    await User.findByIdAndUpdate(req.user.id, { mobile, isVerified: true });
    otpDoc.isUsed = true;
    await otpDoc.save();

    return res.status(200).json(new ApiResponse(200, { mobile, isVerified: true }, "Mobile number verified! ✅"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

module.exports = { forgotPassword, resetPassword, sendMobileOTP, verifyMobileOTP };
