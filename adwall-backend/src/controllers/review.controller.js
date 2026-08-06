const Review = require("../models/Review.model");
const Booking = require("../models/Booking.model");
const Hoarding = require("../models/Hoarding.model");
const ApiResponse = require("../utils/apiResponse");

// @desc   Review do (sirf completed booking ke baad)
// @route  POST /api/reviews
// @access Private (client)
const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json(new ApiResponse(404, null, "Booking not found"));
    if (booking.client.toString() !== req.user.id) {
      return res.status(403).json(new ApiResponse(403, null, "Sirf client hi review de sakta hai"));
    }
    if (booking.status !== "completed") {
      return res.status(400).json(new ApiResponse(400, null, "Booking complete hone ke baad hi review de sakte ho"));
    }

    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) return res.status(409).json(new ApiResponse(409, null, "Is booking ka review already exist karta hai"));

    const review = await Review.create({
      booking: bookingId,
      hoarding: booking.hoarding,
      client: req.user.id,
      owner: booking.owner,
      rating,
      comment,
    });

    // Hoarding ka avg rating update karo
    const allReviews = await Review.find({ hoarding: booking.hoarding });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Hoarding.findByIdAndUpdate(booking.hoarding, {
      rating: Math.round(avgRating * 10) / 10,
      totalReviews: allReviews.length,
    });

    return res.status(201).json(new ApiResponse(201, review, "Review submit ho gaya"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   Hoarding ke saare reviews
// @route  GET /api/reviews/hoarding/:hoardingId
// @access Public
const getHoardingReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ hoarding: req.params.hoardingId })
      .populate("client", "name avatar")
      .sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, reviews, "Reviews fetched"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   Owner review ka reply de
// @route  POST /api/reviews/:id/reply
// @access Private (owner)
const replyToReview = async (req, res) => {
  try {
    const { reply } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json(new ApiResponse(404, null, "Review not found"));
    if (review.owner.toString() !== req.user.id) {
      return res.status(403).json(new ApiResponse(403, null, "Sirf owner hi reply kar sakta hai"));
    }

    review.ownerReply = reply;
    review.ownerRepliedAt = new Date();
    await review.save();

    return res.status(200).json(new ApiResponse(200, review, "Reply post ho gaya"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

module.exports = { createReview, getHoardingReviews, replyToReview };
