const express = require("express");
const router = express.Router();
const {
  addHoarding, searchHoardings, getHoardingById,
  getMyHoardings, updateHoarding, verifyHoarding, getPendingHoardings,
} = require("../controllers/hoarding.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// Public routes
router.get("/", searchHoardings);                 // GET /api/hoardings?city=Delhi&category=hoarding
router.get("/:id", getHoardingById);              // GET /api/hoardings/:id

// Owner routes — /my ko :id ke PEHLE rakhna zaroori hai warna Express "my" ko id samajh leta hai
router.get("/my/listings", protect, authorize("owner"), getMyHoardings);
router.post("/", protect, authorize("owner"), upload.fields([{ name: "images", maxCount: 10 }]), addHoarding);
router.patch("/:id", protect, authorize("owner"), updateHoarding);

// Admin routes
router.get("/admin/pending", protect, authorize("admin"), getPendingHoardings);
router.patch("/:id/verify", protect, authorize("admin"), verifyHoarding);

module.exports = router;
