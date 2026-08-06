const Campaign = require("../models/Campaign.model");
const Hoarding = require("../models/Hoarding.model");
const User = require("../models/User.model");
const ApiResponse = require("../utils/apiResponse");
const notificationService = require("../services/notification.service");

// @desc   Client broadcast campaign create kare
// @route  POST /api/campaigns
// @access Private (client)
const createCampaign = async (req, res) => {
  try {
    const { title, description, cities, categories, budgetMin, budgetMax,
            startDate, endDate, targetAudience, additionalNotes } = req.body;

    const campaign = await Campaign.create({
      client: req.user.id,
      title,
      description,
      requirements: {
        cities,
        categories,
        budget: { min: budgetMin, max: budgetMax },
        startDate,
        endDate,
        targetAudience,
        additionalNotes,
      },
    });

    // AI matching: criteria ke hisaab se eligible hoardings dhundo
    const matchQuery = {
      verificationStatus: "verified",
      isActive: true,
      "pricing.perMonth": { $lte: budgetMax },
    };
    if (cities && cities.length > 0) matchQuery["location.city"] = { $in: cities };
    if (categories && categories.length > 0) matchQuery.category = { $in: categories };

    const matchedHoardings = await Hoarding.find(matchQuery).select("_id owner title location pricing");

    campaign.aiMatchedHoardings = matchedHoardings.map((h) => h._id);
    await campaign.save();

    // Matched hoardings ke owners ko notify karo
    const ownerIds = [...new Set(matchedHoardings.map((h) => h.owner.toString()))];
    const notifyPromises = ownerIds.map((ownerId) =>
      notificationService.createNotification({
        userId: ownerId,
        title: "Naya Broadcast Campaign!",
        message: `Ek client ne campaign broadcast kiya hai jisme aapki hoarding match karti hai. Quote bhejo!`,
        type: "campaign",
        reference: campaign._id,
        referenceModel: "Campaign",
      })
    );
    await Promise.all(notifyPromises);

    return res.status(201).json(
      new ApiResponse(201, {
        campaign,
        matchedHoardings: matchedHoardings.length,
        ownersNotified: ownerIds.length,
      }, `Campaign create ho gaya. ${ownerIds.length} owners ko notify kiya.`)
    );
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   Client apne campaigns dekhe
// @route  GET /api/campaigns/my
// @access Private (client)
const getMyCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ client: req.user.id })
      .populate("aiMatchedHoardings", "title location pricing images")
      .sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, campaigns, "Campaigns fetched"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   Single campaign detail
// @route  GET /api/campaigns/:id
// @access Private
const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate("aiMatchedHoardings", "title location pricing images rating")
      .populate("client", "name email");

    if (!campaign) return res.status(404).json(new ApiResponse(404, null, "Campaign not found"));

    // Sirf client ya admin dekh sakta hai
    if (campaign.client._id.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json(new ApiResponse(403, null, "Access denied"));
    }

    return res.status(200).json(new ApiResponse(200, campaign, "Campaign fetched"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   Campaign close karo
// @route  PATCH /api/campaigns/:id/close
// @access Private (client)
const closeCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json(new ApiResponse(404, null, "Campaign not found"));
    if (campaign.client.toString() !== req.user.id) {
      return res.status(403).json(new ApiResponse(403, null, "Ye campaign tumhara nahi hai"));
    }

    campaign.status = "closed";
    await campaign.save();
    return res.status(200).json(new ApiResponse(200, campaign, "Campaign closed"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   Admin - sabhi campaigns
// @route  GET /api/campaigns/admin/all
// @access Private (admin)
const adminGetAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate("client", "name email")
      .sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, campaigns, "All campaigns fetched"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

module.exports = { createCampaign, getMyCampaigns, getCampaignById, closeCampaign, adminGetAllCampaigns };
