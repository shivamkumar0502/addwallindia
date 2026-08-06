const Hoarding = require("../models/Hoarding.model");
const Booking = require("../models/Booking.model");
const ApiResponse = require("../utils/apiResponse");

// Traffic multiplier ka map
const TRAFFIC_SCORE = { low: 1, medium: 2, high: 3, very_high: 4 };
const LIGHTING_SCORE = { none: 1, frontlit: 2, backlit: 3, led: 4 };

// @desc   AI Visibility Score calculate karo (hoarding ke liye)
// @route  GET /api/ai/visibility-score/:hoardingId
// @access Public
const getVisibilityScore = async (req, res) => {
  try {
    const hoarding = await Hoarding.findById(req.params.hoardingId);
    if (!hoarding) return res.status(404).json(new ApiResponse(404, null, "Hoarding not found"));

    const { dimensions, lighting, dailyTraffic, rating, totalReviews } = hoarding;

    // Score formula: size + traffic + lighting + rating
    const sizeScore = Math.min(((dimensions.width * dimensions.height) / 100), 30); // max 30
    const trafficScore = (TRAFFIC_SCORE[dailyTraffic] || 2) * 15;                  // max 60
    const lightingScore = (LIGHTING_SCORE[lighting] || 1) * 2.5;                   // max 10
    const ratingScore = totalReviews > 0 ? (rating / 5) * 10 : 5;                  // max 10

    const totalScore = Math.round(sizeScore + trafficScore + lightingScore + ratingScore);

    const grade = totalScore >= 80 ? "A+" : totalScore >= 60 ? "A" : totalScore >= 40 ? "B" : "C";

    return res.status(200).json(
      new ApiResponse(200, {
        score: Math.min(totalScore, 100),
        grade,
        breakdown: {
          sizeScore: Math.round(sizeScore),
          trafficScore,
          lightingScore: Math.round(lightingScore),
          ratingScore: Math.round(ratingScore),
        },
        recommendation: totalScore < 50
          ? "LED lighting add karo aur high traffic area choose karo visibility badhane ke liye"
          : "Aapki hoarding ki visibility bahut achhi hai!",
      }, "Visibility score calculated")
    );
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   AI Price Recommendation (similar hoardings ke basis pe)
// @route  GET /api/ai/price-recommendation/:hoardingId
// @access Private (owner)
const getPriceRecommendation = async (req, res) => {
  try {
    const hoarding = await Hoarding.findById(req.params.hoardingId);
    if (!hoarding) return res.status(404).json(new ApiResponse(404, null, "Hoarding not found"));

    // Same city + same category ke verified hoardings ki avg price
    const similar = await Hoarding.find({
      _id: { $ne: hoarding._id },
      "location.city": hoarding.location.city,
      category: hoarding.category,
      verificationStatus: "verified",
    }).select("pricing dimensions dailyTraffic");

    if (similar.length === 0) {
      return res.status(200).json(
        new ApiResponse(200, { recommendation: null, message: "Is city/category me enough data nahi hai abhi" }, "No data")
      );
    }

    const avgPrice = similar.reduce((sum, h) => sum + h.pricing.perMonth, 0) / similar.length;
    const minPrice = Math.min(...similar.map((h) => h.pricing.perMonth));
    const maxPrice = Math.max(...similar.map((h) => h.pricing.perMonth));

    // Adjust based on size comparison
    const avgSize = similar.reduce((sum, h) => sum + h.dimensions.width * h.dimensions.height, 0) / similar.length;
    const mySize = hoarding.dimensions.width * hoarding.dimensions.height;
    const sizeAdjustment = mySize / avgSize;

    const recommended = Math.round(avgPrice * sizeAdjustment);

    return res.status(200).json(
      new ApiResponse(200, {
        currentPrice: hoarding.pricing.perMonth,
        recommendedPrice: recommended,
        marketRange: { min: minPrice, max: maxPrice, avg: Math.round(avgPrice) },
        insight:
          hoarding.pricing.perMonth > recommended * 1.2
            ? "Aapki price market se kaafi zyada hai, bookings kam ho sakti hain"
            : hoarding.pricing.perMonth < recommended * 0.8
            ? "Aap market se sasta de rahe ho, price thoda badhao"
            : "Aapki price market ke andar hai, bilkul sahi hai",
        basedOn: similar.length,
      }, "Price recommendation ready")
    );
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   AI Media Planner - budget ke hisaab se best hoardings suggest karo
// @route  POST /api/ai/media-planner
// @access Private (client)
const getMediaPlan = async (req, res) => {
  try {
    const { cities, budget, categories, startDate, endDate, objective } = req.body;

    if (!budget || !cities || !startDate || !endDate) {
      return res.status(400).json(new ApiResponse(400, null, "Cities, budget aur dates required hain"));
    }

    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    if (days < 1) return res.status(400).json(new ApiResponse(400, null, "Invalid date range"));

    const query = {
      verificationStatus: "verified",
      isActive: true,
      "location.city": { $in: cities.map((c) => new RegExp(c, "i")) },
    };
    if (categories && categories.length > 0) query.category = { $in: categories };

    const allHoardings = await Hoarding.find(query)
      .populate("owner", "name businessDetails")
      .sort({ rating: -1, dailyTraffic: -1 });

    // Budget allocation: best visibility ke hoardings choose karo budget ke andar
    let remainingBudget = budget;
    const selectedHoardings = [];
    let totalReach = 0;

    for (const h of allHoardings) {
      const cost = Math.ceil((h.pricing.perMonth / 30) * days);
      if (cost <= remainingBudget) {
        const visibilityScore =
          (TRAFFIC_SCORE[h.dailyTraffic] || 2) * 15 + (LIGHTING_SCORE[h.lighting] || 1) * 2.5;

        selectedHoardings.push({ hoarding: h, estimatedCost: cost, visibilityScore });
        remainingBudget -= cost;
        totalReach += TRAFFIC_SCORE[h.dailyTraffic] * 10000;

        if (selectedHoardings.length >= 10) break; // max 10 locations
      }
    }

    return res.status(200).json(
      new ApiResponse(200, {
        totalBudget: budget,
        allocatedBudget: budget - remainingBudget,
        remainingBudget,
        estimatedReach: totalReach,
        selectedHoardings,
        summary: `${selectedHoardings.length} locations selected across ${cities.join(", ")} for ${days} days`,
        tip:
          objective === "brand_awareness"
            ? "High traffic locations prefer karo maximum eyeballs ke liye"
            : "Specific area target karo conversion ke liye",
      }, "Media plan ready hai!")
    );
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   AI Budget Planner - objective ke hisaab se budget suggest karo
// @route  POST /api/ai/budget-planner
// @access Private (client)
const getBudgetPlan = async (req, res) => {
  try {
    const { city, category, days, objective } = req.body;

    const hoardings = await Hoarding.find({
      verificationStatus: "verified",
      "location.city": new RegExp(city, "i"),
      category: category || { $exists: true },
    }).select("pricing dailyTraffic");

    if (hoardings.length === 0) {
      return res.status(200).json(new ApiResponse(200, {
        message: "Is city me data nahi hai abhi, pan-India average use kar rahe hain"
      }, "No local data"));
    }

    const avgMonthlyPrice = hoardings.reduce((s, h) => s + h.pricing.perMonth, 0) / hoardings.length;
    const dailyAvg = avgMonthlyPrice / 30;

    const budgetTiers = {
      basic: { budget: Math.round(dailyAvg * days * 1), locations: 1, reach: "10K-50K" },
      standard: { budget: Math.round(dailyAvg * days * 3), locations: 3, reach: "50K-2L" },
      premium: { budget: Math.round(dailyAvg * days * 7), locations: 7, reach: "2L-10L" },
    };

    return res.status(200).json(
      new ApiResponse(200, {
        city,
        days,
        averagePricePerDay: Math.round(dailyAvg),
        recommendations: budgetTiers,
        tip: `${city} me ${category || "sabhi"} ads ke liye ₹${Math.round(dailyAvg)} per day per location average rate hai`,
      }, "Budget plan ready!")
    );
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

module.exports = { getVisibilityScore, getPriceRecommendation, getMediaPlan, getBudgetPlan };
