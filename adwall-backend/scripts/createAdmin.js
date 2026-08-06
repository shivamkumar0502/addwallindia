/**
 * Admin Seed Script — pehla admin user create karne ke liye
 * 
 * Run karo: node scripts/createAdmin.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB connected");
};

const createAdmin = async () => {
  await connectDB();

  // User model directly define karo (import loop avoid karne ke liye)
  const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    mobile: { type: String, unique: true },
    password: { type: String, select: false },
    role: { type: String, default: "client" },
    kycStatus: { type: String, default: "verified" },
    authProvider: { type: String, default: "local" },
    isVerified: { type: Boolean, default: true },
  }, { timestamps: true });

  const User = mongoose.models.User || mongoose.model("User", userSchema);

  // Check karo ki admin pehle se hai ya nahi
  const existing = await User.findOne({ role: "admin" });
  if (existing) {
    console.log("⚠️  Admin pehle se exist karta hai:");
    console.log(`   Email: ${existing.email}`);
    console.log("   Agar password bhool gaye ho toh CHANGE_EMAIL wala option use karo");
    await mongoose.disconnect();
    return;
  }

  // Admin credentials — production me zaroor change karo!
  const adminData = {
    name: "AdWall Admin",
    email: "admin@adwall.in",
    mobile: "9000000000",
    password: "Admin@123",        // ← production me strong password use karo
    role: "admin",
    kycStatus: "verified",
    isVerified: true,
    authProvider: "local",
  };

  // Password hash karo
  const salt = await bcrypt.genSalt(10);
  adminData.password = await bcrypt.hash(adminData.password, salt);

  const admin = await User.create(adminData);

  console.log("\n🎉 Admin user create ho gaya!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Email   : admin@adwall.in`);
  console.log(`  Password: Admin@123`);
  console.log(`  Role    : admin`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n⚠️  Production me zaroor password change karo!\n");

  await mongoose.disconnect();
  console.log("✅ Done!");
};

createAdmin().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
