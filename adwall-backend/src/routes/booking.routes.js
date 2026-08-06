const express = require("express");
const router = express.Router();
const { createBooking, getClientBookings, getOwnerBookings, getBookingById,
        submitInstallationProof, approveInstallation, cancelBooking, adminGetAllBookings } = require("../controllers/booking.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

router.post("/", protect, authorize("client"), createBooking);
router.get("/my", protect, authorize("client"), getClientBookings);
router.get("/owner", protect, authorize("owner"), getOwnerBookings);
router.get("/admin/all", protect, authorize("admin"), adminGetAllBookings);
router.get("/:id", protect, getBookingById);
router.post("/:id/proof", protect, authorize("owner"), upload.fields([{ name: "images", maxCount: 5 }]), submitInstallationProof);
router.post("/:id/approve", protect, authorize("client"), approveInstallation);
router.post("/:id/cancel", protect, cancelBooking);

module.exports = router;
