const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, maxlength: 3 },
  avgConsultMinutes: { type: Number, default: 10 }, // used for wait-time estimate
});

module.exports = mongoose.model("Department", departmentSchema);
