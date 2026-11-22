const express = require("express");
const controller = require("../controllers/token.controller");
const { protect } = require("../middleware/auth.middleware");
const { createTokenLimiter } = require("../middleware/rateLimit.middleware");
const { createTokenRules, callNextRules, validate } = require("../validators/validators");

const router = express.Router();

// Public: patients
router.post("/", createTokenLimiter, createTokenRules, validate, controller.createToken);

// Staff and admin
router.get("/", protect, controller.getTokens);
router.patch("/call-next", protect, callNextRules, validate, controller.callNext); // keep above "/:id" routes

// Public: patient checks own token
router.get("/:id", controller.getTokenById);

// Staff and admin
router.patch("/:id/status", protect, controller.updateStatus);

module.exports = router;
