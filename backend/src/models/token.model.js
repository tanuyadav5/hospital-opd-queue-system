const mongoose = require("mongoose");

const STATUSES = ["waiting", "serving", "completed", "cancelled"];
// Lower rank is called first
const PRIORITY_RANK = { emergency: 0, senior: 1, normal: 2 };

const tokenSchema = new mongoose.Schema(
  {
    tokenNumber: { type: Number, required: true },
    tokenCode: { type: String, required: true }, // e.g. GM-007
    patientName: { type: String, required: true, trim: true, maxlength: 60 },
    phone: { type: String, trim: true, maxlength: 15 },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" }, // set when a doctor calls the patient
    priority: { type: String, enum: Object.keys(PRIORITY_RANK), default: "normal" },
    priorityRank: { type: Number, default: 2 },
    status: { type: String, enum: STATUSES, default: "waiting" },
    calledAt: { type: Date }, // when a doctor called the patient (used for wait-time analytics)
  },
  { timestamps: true }
);

// Speeds up "next waiting patient of a department" queries
tokenSchema.index({ department: 1, status: 1, priorityRank: 1, tokenNumber: 1 });

module.exports = mongoose.model("Token", tokenSchema);
module.exports.STATUSES = STATUSES;
module.exports.PRIORITY_RANK = PRIORITY_RANK;
