const express = require("express");
const router = express.Router();
const { getAvailability, blockDates, setAvailabilityWindow } = require("../controllers/availability.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.get("/:hoardingId", getAvailability);
router.patch("/:hoardingId/block", protect, authorize("owner"), blockDates);
router.patch("/:hoardingId/window", protect, authorize("owner"), setAvailabilityWindow);
module.exports = router;
