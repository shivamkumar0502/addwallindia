const OTP = require("../models/OTP.model");
const User = require("../models/User.model");
const ApiResponse = require("../utils/apiResponse");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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

    // FIX: pehle yahan bcrypt.hash() kiya jaata tha AUR User model ka
    // pre("save") hook bhi hash karta hai — password DOUBLE hash ho jaata tha.
    // Isliye reset ke baad naye password se login kabhi nahi hota tha.
    // Plain password assign karo, hashing hook khud kar lega.
    user.password = newPassword;
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


/* ─────────────────────────────────────────────────────────
   REGISTRATION OTP FLOW
   User khud choose karta hai — email PE ya mobile PE, ek hi.
   Flow:
     1) POST /api/otp/send-register-otp
        { email, mobile, channel: "email" | "mobile" }
     2) POST /api/otp/verify-register-otp
        { email, mobile, channel, otp }  ->  { verifyToken }  (15 min)
     3) POST /api/auth/register { ..., verifyToken }
───────────────────────────────────────────────────────── */

// @route POST /api/otp/send-register-otp
// @access Public
const sendRegisterOTP = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const mobile = req.body.mobile?.trim();
    const channel = req.body.channel === "mobile" ? "mobile" : "email";

    if (!email || !/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json(new ApiResponse(400, null, "Valid email daalo"));
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile))
      return res.status(400).json(new ApiResponse(400, null, "Valid 10-digit mobile number daalo"));

    const existing = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existing)
      return res
        .status(409)
        .json(new ApiResponse(409, null, "Is email ya mobile se account pehle se hai. Login karo."));

    // Jis channel pe bhej rahe hain, wahi identifier hai
    const identifier = channel === "mobile" ? mobile : email;
    const type = channel === "mobile" ? "mobile_verify" : "email_verify";

    // Resend rate limit — 60 sec
    const recent = await OTP.findOne({
      identifier,
      type,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
    });
    if (recent)
      return res
        .status(429)
        .json(new ApiResponse(429, null, "Thodi der ruko — 60 second baad dobara bhejo."));

    await OTP.deleteMany({ identifier, type });

    const otp = generateOTP();
    await OTP.create({ identifier, otp, type, expiresAt: getExpiry() });

    // ── Bhejo, aur SACH ME gaya ya nahi wo track karo ──
    let delivered = false;

    if (channel === "mobile") {
      delivered = await notify.sendSMS(
        mobile,
        `AdWall India: Aapka verification code hai ${otp}. 10 min me expire hoga. Kisi ke saath share mat karo.`
      );
      if (!delivered) {
        delivered = await notify.sendWhatsApp(
          mobile,
          `AdWall India: Aapka verification code hai *${otp}*. 10 min me expire hoga.`
        );
      }
    } else {
      delivered = await notify.sendEmail({
        to: email,
        subject: `${otp} — AdWall India verification code`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
            <div style="background:#f97316;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;">AdWall India</h1>
            </div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:30px;text-align:center;">
              <h2 style="color:#111827;">Email Verification</h2>
              <p style="color:#6b7280;">Account banane ke liye ye code daalo:</p>
              <div style="background:#fff7ed;border:2px solid #fed7aa;border-radius:12px;padding:20px;margin:20px 0;">
                <p style="font-size:40px;font-weight:900;color:#f97316;letter-spacing:8px;margin:0;">${otp}</p>
              </div>
              <p style="color:#6b7280;font-size:14px;">10 minutes ke liye valid hai. Kisi ke saath share mat karo.</p>
            </div>
          </div>`,
      });
    }

    const isDev = process.env.NODE_ENV !== "production";

    // FIX: pehle delivery fail hone pe bhi 200 aata tha aur user
    // OTP ka wait karta rehta tha. Ab saaf batao.
    if (!delivered && !isDev) {
      await OTP.deleteMany({ identifier, type });
      return res.status(502).json(
        new ApiResponse(
          502,
          null,
          channel === "mobile"
            ? "SMS bhejne me problem aayi. Email pe OTP mangwa ke try karo."
            : "Email bhejne me problem aayi. Mobile pe OTP mangwa ke try karo."
        )
      );
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        isDev ? { otp, delivered } : null,
        delivered
          ? channel === "mobile"
            ? `OTP bhej diya! +91 ${mobile} check karo.`
            : `OTP bhej diya! ${email} check karo (spam folder bhi).`
          : "Dev mode: delivery configure nahi hai, OTP screen pe dikha diya hai."
      )
    );
  } catch (err) {
    console.error("sendRegisterOTP:", err);
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @route POST /api/otp/verify-register-otp
// @access Public
const verifyRegisterOTP = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const mobile = req.body.mobile?.trim();
    const channel = req.body.channel === "mobile" ? "mobile" : "email";
    const entered = String(req.body.otp || "").trim();

    if (!email || !mobile || !entered)
      return res.status(400).json(new ApiResponse(400, null, "Email, mobile aur OTP required hain"));

    const identifier = channel === "mobile" ? mobile : email;
    const type = channel === "mobile" ? "mobile_verify" : "email_verify";

    const doc = await OTP.findOne({ identifier, type, isUsed: false });
    if (!doc)
      return res.status(400).json(new ApiResponse(400, null, "OTP invalid ya expire ho gaya. Dobara bhejo."));

    if (doc.attempts >= 5) {
      await OTP.deleteOne({ _id: doc._id });
      return res.status(400).json(new ApiResponse(400, null, "Bahut galat attempts. Dobara OTP bhejo."));
    }

    if (new Date() > doc.expiresAt)
      return res.status(400).json(new ApiResponse(400, null, "OTP expire ho gaya. Dobara bhejo."));

    if (doc.otp !== entered) {
      doc.attempts += 1;
      await doc.save();
      return res
        .status(400)
        .json(new ApiResponse(400, null, `Wrong OTP. ${5 - doc.attempts} attempts bache hain.`));
    }

    doc.isUsed = true;
    await doc.save();

    const verifyToken = jwt.sign(
      { email, mobile, channel, purpose: "register" },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, { verifyToken }, "Verified! Account ban raha hai..."));
  } catch (err) {
    console.error("verifyRegisterOTP:", err);
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
  sendMobileOTP,
  verifyMobileOTP,
  sendRegisterOTP,
  verifyRegisterOTP,
};