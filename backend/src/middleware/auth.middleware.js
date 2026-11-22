const jwt = require("jsonwebtoken");

// Authentication: is the user logged in?
exports.protect = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Please log in first" });

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET); // { id, role }
    next();
  } catch (err) {
    res.status(401).json({ message: "Session expired. Please log in again." });
  }
};

// Authorization: is the user allowed to do this? Use after protect.
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.admin.role)) {
    return res.status(403).json({ message: "You do not have permission to do this" });
  }
  next();
};
