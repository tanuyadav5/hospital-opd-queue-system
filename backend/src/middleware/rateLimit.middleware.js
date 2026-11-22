const rateLimit = require("express-rate-limit");

const base = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test", // tests make many requests
};

// Slows down password guessing
exports.loginLimiter = rateLimit({
  ...base,
  limit: 10,
  message: { message: "Too many login attempts. Try again in 15 minutes." },
});

// Stops one device from flooding the queue with fake tokens
exports.createTokenLimiter = rateLimit({
  ...base,
  limit: 60,
  message: { message: "Too many token requests. Please wait a few minutes." },
});
