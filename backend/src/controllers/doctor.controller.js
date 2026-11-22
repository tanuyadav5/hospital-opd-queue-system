const Doctor = require("../models/doctor.model");

// GET /api/doctors (admin)
exports.getDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find().populate("department", "name code").sort({ name: 1 });
    res.json(doctors);
  } catch (err) {
    next(err);
  }
};
