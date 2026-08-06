const express = require("express");
const router = express.Router();
const { getAllUsers, getUserById } = require("../controllers/admin.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.get("/users", protect, authorize("admin"), getAllUsers);
router.get("/users/:id", protect, authorize("admin"), getUserById);

module.exports = router;
