const express = require("express");
const router = express.Router();
const { exportBookings, exportPayments, exportUsers, exportHoardings, getSummaryReport } = require("../controllers/reports.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.get("/bookings", protect, authorize("admin"), exportBookings);
router.get("/payments", protect, authorize("admin"), exportPayments);
router.get("/users", protect, authorize("admin"), exportUsers);
router.get("/hoardings", protect, authorize("admin"), exportHoardings);
router.get("/summary", protect, authorize("admin"), getSummaryReport);
module.exports = router;
