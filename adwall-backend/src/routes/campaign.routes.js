const express = require("express");
const router = express.Router();
const { createCampaign, getMyCampaigns, getCampaignById, closeCampaign, adminGetAllCampaigns } = require("../controllers/campaign.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.post("/", protect, authorize("client"), createCampaign);
router.get("/my", protect, authorize("client"), getMyCampaigns);
router.get("/admin/all", protect, authorize("admin"), adminGetAllCampaigns);
router.get("/:id", protect, getCampaignById);
router.patch("/:id/close", protect, authorize("client"), closeCampaign);

module.exports = router;
