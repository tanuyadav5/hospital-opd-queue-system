const express = require("express");
const { getAnalytics } = require("../controllers/analytics.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", protect, authorize("admin"), getAnalytics); // admin only

module.exports = router;
