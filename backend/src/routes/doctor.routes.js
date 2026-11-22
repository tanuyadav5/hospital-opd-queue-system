const express = require("express");
const { getDoctors } = require("../controllers/doctor.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", protect, getDoctors);

module.exports = router;
