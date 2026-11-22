const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");

// POST /api/auth/login (input is validated by validators.js before this runs)
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await Admin.findOne({ username });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES || "1d",
    });
    res.json({ token, username: user.username, role: user.role });
  } catch (err) {
    next(err);
  }
};
