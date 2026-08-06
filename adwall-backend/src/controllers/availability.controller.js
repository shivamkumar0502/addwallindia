const Hoarding = require("../models/Hoarding.model");
const Booking = require("../models/Booking.model");
const ApiResponse = require("../utils/apiResponse");

// @desc   Hoarding ki availability check karo (client ke liye)
// @route  GET /api/availability/:hoardingId?year=2026&month=7
// @access Public
const getAvailability = async (req, res) => {
  try {
    const { hoardingId } = req.params;
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

    const hoarding = await Hoarding.findById(hoardingId).select("availability");
    if (!hoarding) return res.status(404).json(new ApiResponse(404, null, "Hoarding not found"));

    // Month ki start/end dates
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Confirmed bookings is month mein
    const bookedDates = await Booking.find({
      hoarding: hoardingId,
      status: { $in: ["confirmed", "payment_done", "proof_submitted", "client_approved"] },
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
      ],
    }).select("startDate endDate");

    // Owner ke manually blocked dates
    const manuallyBlocked = (hoarding.availability?.blockedDates || []).filter(d => {
      const date = new Date(d);
      return date >= startDate && date <= endDate;
    });

    // Booked date ranges expand karo (individual dates)
    const bookedDateSet = new Set();
    bookedDates.forEach(b => {
      const start = new Date(Math.max(b.startDate, startDate));
      const end = new Date(Math.min(b.endDate, endDate));
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        bookedDateSet.add(d.toISOString().split("T")[0]);
      }
    });

    manuallyBlocked.forEach(d => {
      bookedDateSet.add(new Date(d).toISOString().split("T")[0]);
    });

    return res.status(200).json(new ApiResponse(200, {
      hoardingId,
      year: parseInt(year),
      month: parseInt(month),
      bookedDates: Array.from(bookedDateSet),
      availableUntil: hoarding.availability?.availableUntil || null,
    }, "Availability fetched"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   Owner manually dates block/unblock kare
// @route  PATCH /api/availability/:hoardingId/block
// @access Private (owner)
const blockDates = async (req, res) => {
  try {
    const { dates, action } = req.body; // action: "block" | "unblock"
    const hoarding = await Hoarding.findById(req.params.hoardingId);
    if (!hoarding) return res.status(404).json(new ApiResponse(404, null, "Hoarding not found"));
    if (hoarding.owner.toString() !== req.user.id)
      return res.status(403).json(new ApiResponse(403, null, "Ye hoarding aapki nahi hai"));

    if (!hoarding.availability) hoarding.availability = { blockedDates: [] };
    if (!hoarding.availability.blockedDates) hoarding.availability.blockedDates = [];

    if (action === "block") {
      const newDates = dates.filter(d => !hoarding.availability.blockedDates.includes(d));
      hoarding.availability.blockedDates.push(...newDates);
    } else {
      hoarding.availability.blockedDates = hoarding.availability.blockedDates.filter(d => !dates.includes(d));
    }

    await hoarding.save();
    return res.status(200).json(new ApiResponse(200, hoarding.availability, `Dates ${action}ed successfully`));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   Owner availability window set kare
// @route  PATCH /api/availability/:hoardingId/window
// @access Private (owner)
const setAvailabilityWindow = async (req, res) => {
  try {
    const { availableFrom, availableUntil } = req.body;
    const hoarding = await Hoarding.findById(req.params.hoardingId);
    if (!hoarding) return res.status(404).json(new ApiResponse(404, null, "Hoarding not found"));
    if (hoarding.owner.toString() !== req.user.id)
      return res.status(403).json(new ApiResponse(403, null, "Access denied"));

    hoarding.availability = {
      ...hoarding.availability,
      availableFrom: availableFrom ? new Date(availableFrom) : null,
      availableUntil: availableUntil ? new Date(availableUntil) : null,
    };
    await hoarding.save();
    return res.status(200).json(new ApiResponse(200, hoarding.availability, "Availability window updated"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

module.exports = { getAvailability, blockDates, setAvailabilityWindow };
