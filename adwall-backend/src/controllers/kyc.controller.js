const notify = require("../services/notification.service");
const User = require("../models/User.model");
const ApiResponse = require("../utils/apiResponse");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// @desc   Owner KYC documents submit kare (Aadhaar, PAN, Selfie)
// @route  POST /api/kyc/submit
// @access Private (owner only)
const submitKyc = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gstNumber, companyName, agencyName, address } = req.body;

    // req.files multer.fields() se aayega: { aadhaar: [file], pan: [file], selfie: [file] }
    if (!req.files || !req.files.aadhaar || !req.files.pan || !req.files.selfie) {
      return res.status(400).json(
        new ApiResponse(400, null, "Aadhaar, PAN and Selfie - teeno documents required hain")
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    if (user.role !== "owner") {
      return res.status(403).json(new ApiResponse(403, null, "Only owners need to submit KYC"));
    }

    // Teeno files parallel me Cloudinary pe upload karo - time bachega
    const [aadhaarResult, panResult, selfieResult] = await Promise.all([
      uploadToCloudinary(req.files.aadhaar[0].buffer, "aadhaar"),
      uploadToCloudinary(req.files.pan[0].buffer, "pan"),
      uploadToCloudinary(req.files.selfie[0].buffer, "selfie"),
    ]);

    user.kycDocuments = {
      aadhaarUrl: aadhaarResult.secure_url,
      panUrl: panResult.secure_url,
      selfieUrl: selfieResult.secure_url,
      gstNumber: gstNumber || null,
    };
    user.businessDetails = {
      companyName: companyName || null,
      agencyName: agencyName || null,
      address: address || null,
    };
    user.kycStatus = "pending"; // admin review ke wait me

    await user.save();

    return res.status(200).json(
      new ApiResponse(200, { kycStatus: user.kycStatus }, "KYC documents submitted successfully, admin review pending hai")
    );
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
};

// @desc   Apna KYC status check kare (owner)
// @route  GET /api/kyc/status
// @access Private (owner only)
const getMyKycStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("kycStatus kycDocuments businessDetails");
    return res.status(200).json(new ApiResponse(200, user, "KYC status fetched"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
};

// @desc   Sab pending KYC requests list karo (admin)
// @route  GET /api/kyc/pending
// @access Private (admin only)
const getPendingKycList = async (req, res) => {
  try {
    const pendingOwners = await User.find({ role: "owner", kycStatus: "pending" }).select(
      "name email mobile kycDocuments businessDetails createdAt"
    );
    return res.status(200).json(new ApiResponse(200, pendingOwners, "Pending KYC list fetched"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
};

// @desc   Owner ka KYC approve ya reject karo (admin)
// @route  PATCH /api/kyc/:userId/review
// @access Private (admin only)
const reviewKyc = async (req, res) => {
  try {
    const { userId } = req.params;
    const { decision, rejectionReason } = req.body; // decision: "verified" | "rejected"

    if (!["verified", "rejected"].includes(decision)) {
      return res.status(400).json(new ApiResponse(400, null, "Decision must be 'verified' or 'rejected'"));
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "owner") {
      return res.status(404).json(new ApiResponse(404, null, "Owner not found"));
    }

    user.kycStatus = decision;
    await user.save();

    notify.notifyKycStatus(user, decision, rejectionReason).catch(console.error);

    return res.status(200).json(
      new ApiResponse(200, { userId: user._id, kycStatus: user.kycStatus }, `KYC ${decision} successfully`)
    );
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
};

module.exports = { submitKyc, getMyKycStatus, getPendingKycList, reviewKyc };
