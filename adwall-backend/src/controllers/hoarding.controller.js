const notify = require("../services/notification.service");
const Hoarding = require("../models/Hoarding.model");
const ApiResponse = require("../utils/apiResponse");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// @desc   Owner apni hoarding add kare
// @route  POST /api/hoardings
// @access Private (owner only)
const addHoarding = async (req, res) => {
  try {
    const {
      title, description, category,
      city, area, address, longitude, latitude,
      width, height,
      perDay, perWeek, perMonth, isNegotiable,
      facingDirection, lighting, dailyTraffic, landmarkNearby,
    } = req.body;

    // Coordinates required hain
    if (!longitude || !latitude) {
      return res.status(400).json(new ApiResponse(400, null, "Location coordinates required hain"));
    }

    // KYC verified owner hi hoarding add kar sakta hai
    const User = require("../models/User.model");
    const owner = await User.findById(req.user.id);
    if (owner.kycStatus !== "verified") {
      return res.status(403).json(new ApiResponse(403, null, "Pehle KYC verify karwao, phir hoarding add kar sakte ho"));
    }

    // Images upload Cloudinary pe
    let imageUrls = [];
    if (req.files && req.files.images) {
      const uploadPromises = req.files.images.map((file) =>
        uploadToCloudinary(file.buffer, "hoardings")
      );
      const results = await Promise.all(uploadPromises);
      imageUrls = results.map((r) => r.secure_url);
    }

    const hoarding = await Hoarding.create({
      owner: req.user.id,
      title, description, category,
      location: {
        city, area, address,
        coordinates: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
      },
      dimensions: { width: parseFloat(width), height: parseFloat(height) },
      images: imageUrls,
      pricing: { perDay, perWeek, perMonth, isNegotiable },
      facingDirection, lighting, dailyTraffic, landmarkNearby,
    });

    return res.status(201).json(new ApiResponse(201, hoarding, "Hoarding submitted, admin verification pending hai"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
};

// @desc   Search hoardings with filters (public route)
// @route  GET /api/hoardings?city=Delhi&category=hoarding&minPrice=5000&maxPrice=50000
// @access Public
const searchHoardings = async (req, res) => {
  try {
    const {
      city, area, category,
      minPrice, maxPrice,
      lighting, dailyTraffic,
      page = 1, limit = 12,
      sortBy = "createdAt",    // createdAt | price | rating
    } = req.query;

    const query = { verificationStatus: "verified", isActive: true };

    // Filters
    if (city) query["location.city"] = { $regex: city, $options: "i" }; // case-insensitive search
    if (area) query["location.area"] = { $regex: area, $options: "i" };
    if (category) query.category = category;
    if (lighting) query.lighting = lighting;
    if (dailyTraffic) query.dailyTraffic = dailyTraffic;

    if (minPrice || maxPrice) {
      query["pricing.perMonth"] = {};
      if (minPrice) query["pricing.perMonth"].$gte = parseInt(minPrice);
      if (maxPrice) query["pricing.perMonth"].$lte = parseInt(maxPrice);
    }

    // Sort logic
    let sortOption = { createdAt: -1 };
    if (sortBy === "price") sortOption = { "pricing.perMonth": 1 };
    if (sortBy === "rating") sortOption = { rating: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [hoardings, total] = await Promise.all([
      Hoarding.find(query)
        .populate("owner", "name businessDetails.agencyName") // owner ka naam aur agency
        .select("-__v")
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      Hoarding.countDocuments(query),
    ]);

    return res.status(200).json(
      new ApiResponse(200, {
        hoardings,
        pagination: {
          total,
          page: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          hasNextPage: skip + hoardings.length < total,
        },
      }, "Hoardings fetched")
    );
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
};

// @desc   Single hoarding detail
// @route  GET /api/hoardings/:id
// @access Public
const getHoardingById = async (req, res) => {
  try {
    const hoarding = await Hoarding.findById(req.params.id)
      .populate("owner", "name avatar businessDetails kycStatus");

    if (!hoarding || hoarding.verificationStatus !== "verified") {
      return res.status(404).json(new ApiResponse(404, null, "Hoarding not found"));
    }

    // View count increment
    hoarding.views += 1;
    await hoarding.save();

    return res.status(200).json(new ApiResponse(200, hoarding, "Hoarding detail fetched"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
};

// @desc   Owner apni saari hoardings dekhe
// @route  GET /api/hoardings/my
// @access Private (owner only)
const getMyHoardings = async (req, res) => {
  try {
    const hoardings = await Hoarding.find({ owner: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, hoardings, "My hoardings fetched"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
};

// @desc   Owner apni hoarding update kare
// @route  PATCH /api/hoardings/:id
// @access Private (owner only)
const updateHoarding = async (req, res) => {
  try {
    const hoarding = await Hoarding.findById(req.params.id);

    if (!hoarding) return res.status(404).json(new ApiResponse(404, null, "Hoarding not found"));

    if (hoarding.owner.toString() !== req.user.id) {
      return res.status(403).json(new ApiResponse(403, null, "Ye hoarding tumhari nahi hai"));
    }

    // Price ya description update karne pe re-verification nahi chahiye
    // Lekin location ya category change hone pe admin ko re-verify karna chahiye
    const sensitiveFields = ["category", "location"];
    const isReVerifyNeeded = sensitiveFields.some((f) => req.body[f]);

    const updateData = { ...req.body };
    if (isReVerifyNeeded) updateData.verificationStatus = "pending";

    const updated = await Hoarding.findByIdAndUpdate(req.params.id, updateData, { new: true });
    return res.status(200).json(new ApiResponse(200, updated, "Hoarding updated" + (isReVerifyNeeded ? ", re-verification pending" : "")));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
};

// @desc   Admin hoarding verify ya reject kare
// @route  PATCH /api/hoardings/:id/verify
// @access Private (admin only)
const verifyHoarding = async (req, res) => {
  try {
    const { decision, rejectionReason } = req.body; // decision: "verified" | "rejected"

    if (!["verified", "rejected"].includes(decision)) {
      return res.status(400).json(new ApiResponse(400, null, "Decision 'verified' ya 'rejected' hona chahiye"));
    }

    const hoarding = await Hoarding.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: decision,
        rejectionReason: decision === "rejected" ? rejectionReason : null,
      },
      { new: true }
    );

    if (!hoarding) return res.status(404).json(new ApiResponse(404, null, "Hoarding not found"));

    const ownerUser = await require("../models/User.model").findById(hoarding.owner); if(ownerUser) notify.notifyHoardingStatus(hoarding, ownerUser, decision, rejectionReason).catch(console.error);

    return res.status(200).json(new ApiResponse(200, hoarding, `Hoarding ${decision}`));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
};

// @desc   Admin - sabhi pending hoardings dekhe
// @route  GET /api/hoardings/admin/pending
// @access Private (admin only)
const getPendingHoardings = async (req, res) => {
  try {
    const hoardings = await Hoarding.find({ verificationStatus: "pending" })
      .populate("owner", "name email mobile kycStatus")
      .sort({ createdAt: 1 }); // purani pehle
    return res.status(200).json(new ApiResponse(200, hoardings, "Pending hoardings fetched"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
};

module.exports = {
  addHoarding, searchHoardings, getHoardingById,
  getMyHoardings, updateHoarding, verifyHoarding, getPendingHoardings,
};
