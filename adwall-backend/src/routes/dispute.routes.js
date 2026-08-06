const express = require("express");
const router = express.Router();
const { raiseDispute, resolveDispute, getAllDisputes } = require("../controllers/dispute.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.post("/:bookingId/raise", protect, raiseDispute);
router.patch("/:bookingId/resolve", protect, authorize("admin"), resolveDispute);
router.get("/admin/all", protect, authorize("admin"), getAllDisputes);

module.exports = router;
