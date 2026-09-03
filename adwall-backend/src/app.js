// // const express = require("express");
// // const cors = require("cors");
// // const cookieParser = require("cookie-parser");
// // const helmet = require("helmet");
// // const compression = require("compression");
// // const morgan = require("morgan");
// // const rateLimit = require("express-rate-limit");

// // // Routes
// // const authRoutes = require("./routes/auth.routes");
// // const profileRoutes = require("./routes/profile.routes");
// // const kycRoutes = require("./routes/kyc.routes");
// // const hoardingRoutes = require("./routes/hoarding.routes");
// // const bookingRoutes = require("./routes/booking.routes");
// // const quoteRoutes = require("./routes/quote.routes");
// // const paymentRoutes = require("./routes/payment.routes");
// // const walletRoutes = require("./routes/wallet.routes");
// // const agreementRoutes = require("./routes/agreement.routes");
// // const reviewRoutes = require("./routes/review.routes");
// // const campaignRoutes = require("./routes/campaign.routes");
// // const analyticsRoutes = require("./routes/analytics.routes");
// // const notificationRoutes = require("./routes/notification.routes");
// // const aiRoutes = require("./routes/ai.routes");
// // const adminRoutes = require("./routes/admin.routes");
// // const disputeRoutes = require("./routes/dispute.routes");
// // const chatbotRoutes = require("./routes/chatbot.routes");
// // const chatRoutes = require("./routes/chat.routes");
// // const featuredRoutes = require("./routes/featured.routes");
// // // const chatbotRoutes = require("./routes/chatbot.routes");
// // const { errorHandler, notFound } = require("./middlewares/error.middleware");

// // const app = express();

// // // ── Security Middleware ──
// // app.use(helmet({
// //   crossOriginResourcePolicy: { policy: "cross-origin" }, // Cloudinary images ke liye
// // }));
// // app.use(compression()); // Response compress karo — bandwidth bachao
// // app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")); // Request logging

// // // ── Rate Limiting ──
// // const globalLimiter = rateLimit({
// //   windowMs: 15 * 60 * 1000, // 15 minutes
// //   max: 500,                  // max 200 requests per IP
// //   message: { success: false, message: "Too many requests. Please try again after 15 minutes." },
// //   standardHeaders: true,
// //   legacyHeaders: false,
// // });

// // const authLimiter = rateLimit({
// //   windowMs: 15 * 60 * 1000,
// //   max: 10, // login/register attempts limit karo
// //   message: { success: false, message: "Too many auth attempts. Please try again after 15 minutes." },
// // });

// // app.use(globalLimiter);

// // // ── Core Middleware ──
// // // app.use(cors({
// // //   origin: process.env.CLIENT_URL || "http://localhost:5173",
// // //   credentials: true,
// // // }));
// // const allowedOrigins = [
// //   "http://localhost:5173",
// //   process.env.CLIENT_URL,
// //   process.env.CLIENT_URL_WWW,
// // ].filter(Boolean);

// // app.use(cors({
// //   origin: function (origin, callback) {
// //     // Postman/mobile apps/no-origin requests
// //     if (!origin) return callback(null, true);

// //     if (allowedOrigins.includes(origin)) {
// //       return callback(null, true);
// //     }

// //     return callback(new Error("CORS not allowed"));
// //   },
// //   credentials: true,
// // }));
// // app.use(express.json({ limit: "10mb" }));
// // app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// // app.use(cookieParser());

// // // ── Health Check ──
// // app.get("/api/health", (req, res) => {
// //   res.status(200).json({
// //     status: "OK",
// //     message: "AdWall India Backend 🚀",
// //     timestamp: new Date().toISOString(),
// //     env: process.env.NODE_ENV,
// //   });
// // });

// // // ── Routes ──
// // app.use("/api/auth", authLimiter, authRoutes);
// // app.use("/api/profile", profileRoutes);
// // app.use("/api/kyc", kycRoutes);
// // app.use("/api/hoardings", hoardingRoutes);
// // app.use("/api/bookings", bookingRoutes);
// // app.use("/api/quotes", quoteRoutes);
// // app.use("/api/payments", paymentRoutes);
// // app.use("/api/wallet", walletRoutes);
// // app.use("/api/agreements", agreementRoutes);
// // app.use("/api/reviews", reviewRoutes);
// // app.use("/api/campaigns", campaignRoutes);
// // app.use("/api/analytics", analyticsRoutes);
// // app.use("/api/notifications", notificationRoutes);
// // app.use("/api/ai", aiRoutes);
// // app.use("/api/admin", adminRoutes);
// // app.use("/api/disputes", disputeRoutes);
// // app.use("/api/chatbot", chatbotRoutes);
// // app.use("/api/chat", chatRoutes);
// // // app.use("/api/chatbot", chatbotRoutes);
// // app.use("/api/featured", featuredRoutes);
// // // ── Error Handling ──
// // app.use(notFound);
// // app.use(errorHandler);

// // module.exports = app;



// const express = require("express");
// const cors = require("cors");
// const cookieParser = require("cookie-parser");
// const helmet = require("helmet");
// const compression = require("compression");
// const morgan = require("morgan");
// const rateLimit = require("express-rate-limit");

// const app = express();

// // ── CORS — localhost + production domain dono allow ──
// const allowedOrigins = [
//   "http://localhost:5173",
//   "http://localhost:5002",
//   "http://127.0.0.1:5173",
//   process.env.CLIENT_URL,       // Hostinger URL
// ].filter(Boolean);

// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin) return callback(null, true); // Postman/curl
//     if (allowedOrigins.some(o => origin === o || origin.startsWith(o)))
//       return callback(null, true);
//     // Render + Hostinger domains allow
//     if (
//       origin.includes("onrender.com") ||
//       origin.includes("hostinger") ||
//       origin.includes("hstgr") ||
//       origin.includes("web.app") ||
//       origin.includes("vercel.app") ||
//       origin.includes("adwallindia") ||
//       origin.startsWith("exp://") ||          // Expo Go
//       origin.includes("localhost")            // dev
//     ) return callback(null, true);
//     console.warn(`CORS blocked: ${origin}`);
//     return callback(null, false); // Block but don't throw
//   },
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"],
// }));

// app.options("*", cors());

// // ── Security ──
// app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
// app.use(compression());
// app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// // ── Rate Limiting — /health pe NAHI lagana ──
// const globalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 300,
//   skip: (req) => req.path === "/api/health", // Health check skip
//   message: { success: false, message: "Too many requests. 15 min baad try karo." },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 20,
//   message: { success: false, message: "Too many auth attempts. 15 min baad try karo." },
// });

// app.use(globalLimiter);
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// app.use(cookieParser());

// // ── Health Check (rate limit nahi) ──
// app.get("/api/health", (req, res) => {
//   res.status(200).json({
//     status: "OK",
//     message: "AdWall India Backend 🚀",
//     timestamp: new Date().toISOString(),
//     uptime: Math.floor(process.uptime()) + "s",
//   });
// });

// // ── Routes ──
// const authRoutes = require("./routes/auth.routes");
// const profileRoutes = require("./routes/profile.routes");
// const kycRoutes = require("./routes/kyc.routes");
// const hoardingRoutes = require("./routes/hoarding.routes");
// const bookingRoutes = require("./routes/booking.routes");
// const quoteRoutes = require("./routes/quote.routes");
// const paymentRoutes = require("./routes/payment.routes");
// const walletRoutes = require("./routes/wallet.routes");
// const agreementRoutes = require("./routes/agreement.routes");
// const reviewRoutes = require("./routes/review.routes");
// const campaignRoutes = require("./routes/campaign.routes");
// const analyticsRoutes = require("./routes/analytics.routes");
// const notificationRoutes = require("./routes/notification.routes");
// const aiRoutes = require("./routes/ai.routes");
// const adminRoutes = require("./routes/admin.routes");
// const disputeRoutes = require("./routes/dispute.routes");

// app.use("/api/auth", authLimiter, authRoutes);
// app.use("/api/profile", profileRoutes);
// app.use("/api/kyc", kycRoutes);
// app.use("/api/hoardings", hoardingRoutes);
// app.use("/api/bookings", bookingRoutes);
// app.use("/api/quotes", quoteRoutes);
// app.use("/api/payments", paymentRoutes);
// app.use("/api/wallet", walletRoutes);
// app.use("/api/agreements", agreementRoutes);
// app.use("/api/reviews", reviewRoutes);
// app.use("/api/campaigns", campaignRoutes);
// app.use("/api/analytics", analyticsRoutes);
// app.use("/api/notifications", notificationRoutes);
// app.use("/api/ai", aiRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/disputes", disputeRoutes);

// // ── FIX: ye routes pehle server.js me mount ho rahe the, jo app.js ke
// // 404 handler ke BAAD chalta hai. Isliye /api/chat, /api/otp, /api/coupons,
// // /api/featured, /api/subscriptions, /api/invoices, /api/availability,
// // /api/reports, /api/chatbot sab 404 de rahe the. Ab yahin mount karo. ──
// app.use("/api/chat", require("./routes/chat.routes"));
// app.use("/api/featured", require("./routes/featured.routes"));
// app.use("/api/coupons", require("./routes/coupon.routes"));
// app.use("/api/subscriptions", require("./routes/subscription.routes"));
// app.use("/api/invoices", require("./routes/invoice.routes"));
// app.use("/api/availability", require("./routes/availability.routes"));
// app.use("/api/reports", require("./routes/reports.routes"));
// app.use("/api/otp", require("./routes/otp.routes"));
// app.use("/api/chatbot", require("./routes/chatbot.routes"));

// // ── 404 ──
// app.use((req, res) => {
//   res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
// });

// // ── Error Handler ──
// app.use((err, req, res, next) => {
//   console.error("Server error:", err.message);
//   res.status(500).json({ success: false, message: err.message || "Internal server error" });
// });

// module.exports = app;

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const app = express();

// ── CORS — localhost + production domain dono allow ──
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5002",
  "http://127.0.0.1:5173",
  process.env.CLIENT_URL,       // Hostinger URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Postman/curl
    if (allowedOrigins.some(o => origin === o || origin.startsWith(o)))
      return callback(null, true);
    // Render + Hostinger domains allow
    if (
      origin.includes("onrender.com") ||
      origin.includes("hostinger") ||
      origin.includes("hstgr") ||
      origin.includes("web.app") ||
      origin.includes("vercel.app") ||
      origin.includes("adwallindia") ||
      origin.startsWith("exp://") ||          // Expo Go
      origin.includes("localhost")            // dev
    ) return callback(null, true);
    console.warn(`CORS blocked: ${origin}`);
    return callback(null, false); // Block but don't throw
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"],
}));

app.options("*", cors());

// ── Security ──
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Rate Limiting — /health pe NAHI lagana ──
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  skip: (req) => req.path === "/api/health", // Health check skip
  message: { success: false, message: "Too many requests. 15 min baad try karo." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many auth attempts. 15 min baad try karo." },
});

app.use(globalLimiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ── Health Check (rate limit nahi) ──
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "AdWall India Backend 🚀",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + "s",
  });
});

// ── Routes ──
const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const kycRoutes = require("./routes/kyc.routes");
const hoardingRoutes = require("./routes/hoarding.routes");
const bookingRoutes = require("./routes/booking.routes");
const quoteRoutes = require("./routes/quote.routes");
const paymentRoutes = require("./routes/payment.routes");
const walletRoutes = require("./routes/wallet.routes");
const agreementRoutes = require("./routes/agreement.routes");
const reviewRoutes = require("./routes/review.routes");
const campaignRoutes = require("./routes/campaign.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const notificationRoutes = require("./routes/notification.routes");
const aiRoutes = require("./routes/ai.routes");
const adminRoutes = require("./routes/admin.routes");
const disputeRoutes = require("./routes/dispute.routes");

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/hoardings", hoardingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/agreements", agreementRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/disputes", disputeRoutes);

// ── FIX: ye routes pehle server.js me mount ho rahe the, jo app.js ke
// 404 handler ke BAAD chalta hai. Isliye /api/chat, /api/otp, /api/coupons,
// /api/featured, /api/subscriptions, /api/invoices, /api/availability,
// /api/reports, /api/chatbot sab 404 de rahe the. Ab yahin mount karo. ──
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/featured", require("./routes/featured.routes"));
app.use("/api/coupons", require("./routes/coupon.routes"));
app.use("/api/subscriptions", require("./routes/subscription.routes"));
app.use("/api/invoices", require("./routes/invoice.routes"));
app.use("/api/availability", require("./routes/availability.routes"));
app.use("/api/reports", require("./routes/reports.routes"));
app.use("/api/otp", require("./routes/otp.routes"));
app.use("/api/chatbot", require("./routes/chatbot.routes"));
app.use("/api/contact", require("./routes/contact.routes"));

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

// ── Error Handler ──
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(500).json({ success: false, message: err.message || "Internal server error" });
});

module.exports = app;