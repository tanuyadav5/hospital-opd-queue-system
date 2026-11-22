const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
  room: { type: String, trim: true },
});

module.exports = mongoose.model("Doctor", doctorSchema);
