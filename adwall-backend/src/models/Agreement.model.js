const mongoose = require("mongoose");

const agreementSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hoarding: { type: mongoose.Schema.Types.ObjectId, ref: "Hoarding", required: true },

    agreementNumber: { type: String, unique: true, required: true },
    pdfUrl: { type: String, default: null }, // Cloudinary pe store hoga
    
    terms: { type: String, default: null },

    // Digital signatures (Phase 2 me implement hoga - abhi basic flags)
    clientSigned: { type: Boolean, default: false },
    ownerSigned: { type: Boolean, default: false },
    clientSignedAt: { type: Date, default: null },
    ownerSignedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Agreement", agreementSchema);
