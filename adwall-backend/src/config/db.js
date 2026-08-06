const mongoose = require("mongoose");

// MongoDB se connect karne wala function
// server.js me ise call karenge app start hone se pehle
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1); // connection fail hone par server band kar do, warna app crash hoga baad me
  }
};

module.exports = connectDB;
