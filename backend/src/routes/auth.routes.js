const express = require("express");
const { login } = require("../controllers/auth.controller");
const { loginLimiter } = require("../middleware/rateLimit.middleware");
const { loginRules, validate } = require("../validators/validators");

const router = express.Router();

router.post("/login", loginLimiter, loginRules, validate, login);

module.exports = router;
