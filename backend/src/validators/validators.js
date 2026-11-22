const { body, validationResult } = require("express-validator");

// Runs after the rules; answers 400 with the first problem found
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
};

exports.loginRules = [
  body("username").isString().trim().notEmpty().withMessage("Username and password are required"),
  body("password").isString().notEmpty().withMessage("Username and password are required"),
];

exports.createTokenRules = [
  body("patientName").isString().trim().isLength({ min: 1, max: 60 }).withMessage("Patient name is required (max 60 characters)"),
  body("phone").optional({ values: "falsy" }).matches(/^[0-9+\-\s]{6,15}$/).withMessage("Enter a valid phone number"),
  body("department").isMongoId().withMessage("Choose a valid department"),
  body("priority").optional().isIn(["normal", "senior", "emergency"]).withMessage("Invalid priority"),
];

exports.callNextRules = [body("doctorId").isMongoId().withMessage("Choose a valid doctor")];
