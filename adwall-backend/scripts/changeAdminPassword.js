/**
 * Admin Password Change Script
 * Run karo: node scripts/changeAdminPassword.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected");

  // Yahan naya password set karo
  const NEW_PASSWORD = "NewStrongPass@456"; // ← apna password yahan likhho

  const userSchema = new mongoose.Schema({
    email: String, role: String, password: String,
  });
  const User = mongoose.models.User || mongoose.model("User", userSchema);

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(NEW_PASSWORD, salt);

  const result = await User.updateOne(
    { role: "admin" },
    { $set: { password: hashed } }
  );

  if (result.modifiedCount > 0) {
    console.log(`✅ Admin password changed successfully!`);
    console.log(`   New password: ${NEW_PASSWORD}`);
  } else {
    console.log("❌ Admin user nahi mila. Pehle createAdmin.js run karo.");
  }

  await mongoose.disconnect();
};

run().catch(err => { console.error(err); process.exit(1); });
