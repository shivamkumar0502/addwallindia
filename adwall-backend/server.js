require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const setupSocket = require("./src/socket/socket");

// Phase 2 routes
const chatRoutes = require("./src/routes/chat.routes");
const featuredRoutes = require("./src/routes/featured.routes");
const couponRoutes = require("./src/routes/coupon.routes");
const subscriptionRoutes = require("./src/routes/subscription.routes");
const invoiceRoutes = require("./src/routes/invoice.routes");
const availabilityRoutes = require("./src/routes/availability.routes");
const reportsRoutes = require("./src/routes/reports.routes");
const otpRoutes = require("./src/routes/otp.routes");

app.use("/api/chat", chatRoutes);
app.use("/api/featured", featuredRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/otp", otpRoutes);
const chatbotRoutes = require("./src/routes/chatbot.routes");
app.use("/api/chatbot", chatbotRoutes);

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
});

setupSocket(io);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`🔌 Socket.io: ready`);
    console.log(`📧 Email: ${process.env.EMAIL_USER ? "✅" : "⚠️  Not set"}`);
    console.log(`📱 SMS: ${process.env.TWILIO_ACCOUNT_SID ? "✅" : "⚠️  Not set"}`);
    console.log(`💬 WhatsApp: ${process.env.TWILIO_WHATSAPP_FROM ? "✅" : "⚠️  Not set"}`);
  });
});
