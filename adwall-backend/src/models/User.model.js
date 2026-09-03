// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const userSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, "Name is required"],
//       trim: true,
//     },
//     email: {
//       type: String,
//       required: [true, "Email is required"],
//       unique: true,
//       lowercase: true,
//       trim: true,
//       match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
//     },
//     mobile: {
//       type: String,
//       required: [true, "Mobile number is required"],
//       unique: true,
//       match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number"],
//     },
//     password: {
//       type: String,
//       required: function () {
//         // Google se signup kiya hai to password zaroori nahi
//         return this.authProvider === "local";
//       },
//       minlength: 6,
//       select: false, // by default password query me nahi aayega, security ke liye
//     },
//     authProvider: {
//       type: String,
//       enum: ["local", "google"],
//       default: "local",
//     },
//     googleId: {
//       type: String,
//       default: undefined,
//       unique: true,
//       sparse: true, // sparse: true zaroori hai warna multiple null values pe unique error aayega
//     },
//     avatar: {
//       type: String,
//       default: null, // Google profile photo yahan store hogi
//     },
//     role: {
//       type: String,
//       enum: ["client", "owner", "admin"],
//       default: "client",
//     },
//     // Owner-specific fields (client ke liye ye empty rahenge)
//     kycStatus: {
//       type: String,
//       enum: ["pending", "verified", "rejected"],
//       default: "pending",
//     },
//     kycDocuments: {
//       aadhaarUrl: { type: String, default: null },
//       panUrl: { type: String, default: null },
//       selfieUrl: { type: String, default: null },
//       gstNumber: { type: String, default: null },
//     },
//     businessDetails: {
//       companyName: { type: String, default: null },
//       agencyName: { type: String, default: null },
//       address: { type: String, default: null },
//     },
//     isVerified: {
//       type: Boolean,
//       default: false, // mobile/email verify hua ya nahi (OTP wala flow baad me)
//     },
//     refreshToken: {
//       type: String,
//       select: false, // refresh token bhi hide rahega normal queries me
//     },
//   },
//   { timestamps: true } // createdAt, updatedAt apne aap aa jayenge
// );

// // Password save hone se pehle hash karo (sirf jab password modify/naya ho aur exist kare)
// userSchema.pre("save", async function (next) {
//   if (!this.password || !this.isModified("password")) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // Login ke time password match karne ka instance method
// userSchema.methods.comparePassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model("User", userSchema);


const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    // FIX: mobile ab optional hai. Pehle required + strict regex tha, aur
    // controller "pending_<timestamp>" bhej raha tha -> har register
    // validation error se fail hota tha. unique bhi sparse hona chahiye,
    // warna multiple users bina mobile ke duplicate-key error dete hain.
    mobile: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      default: undefined,
      trim: true,
      validate: {
        validator: (v) => !v || /^[6-9]\d{9}$/.test(v),
        message: "Please enter a valid 10-digit mobile number",
      },
    },
    password: {
      type: String,
      required: function () {
        // Google se signup kiya hai to password zaroori nahi
        return this.authProvider === "local";
      },
      minlength: 6,
      select: false, // by default password query me nahi aayega, security ke liye
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      default: undefined,
      unique: true,
      sparse: true, // sparse: true zaroori hai warna multiple null values pe unique error aayega
    },
    avatar: {
      type: String,
      default: null, // Google profile photo yahan store hogi
    },
    role: {
      type: String,
      enum: ["client", "owner", "admin"],
      default: "client",
    },
    // Owner-specific fields (client ke liye ye empty rahenge)
    kycStatus: {
      type: String,
      enum: ["not_submitted", "pending", "verified", "rejected"],
      default: "pending",
    },
    kycDocuments: {
      aadhaarUrl: { type: String, default: null },
      panUrl: { type: String, default: null },
      selfieUrl: { type: String, default: null },
      gstNumber: { type: String, default: null },
    },
    businessDetails: {
      companyName: { type: String, default: null },
      agencyName: { type: String, default: null },
      address: { type: String, default: null },
    },
    isVerified: {
      type: Boolean,
      default: false, // koi ek channel verify ho gaya
    },
    // Register karte waqt user ek hi channel choose karta hai.
    // Dusra baad me profile se verify kara sakte ho.
    emailVerified: { type: Boolean, default: false },
    mobileVerified: { type: Boolean, default: false },
    refreshToken: {
      type: String,
      select: false, // refresh token bhi hide rahega normal queries me
    },
  },
  { timestamps: true } // createdAt, updatedAt apne aap aa jayenge
);

// Password save hone se pehle hash karo (sirf jab password modify/naya ho aur exist kare)
userSchema.pre("save", async function (next) {
  if (!this.password || !this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Login ke time password match karne ka instance method
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false; // FIX: google-only account pe crash hota tha
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);