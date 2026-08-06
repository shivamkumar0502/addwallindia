const express = require("express");
const router = express.Router();
const { getMyWallet, getTransactions, adminGetWallet } = require("../controllers/wallet.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.get("/", protect, getMyWallet);
router.get("/transactions", protect, getTransactions);
router.get("/admin/:userId", protect, authorize("admin"), adminGetWallet);

module.exports = router;
