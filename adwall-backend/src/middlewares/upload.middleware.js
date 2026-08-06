const multer = require("multer");

// Memory storage - file disk pe save nahi hogi, buffer me rahegi, seedha Cloudinary pe stream karenge
const storage = multer.memoryStorage();

// Sirf images allow karo (Aadhaar/PAN/Selfie photos honge, PDF bhi allow kar rahe hain Aadhaar PDF ke liye)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG and PDF files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per file
});

module.exports = upload;
