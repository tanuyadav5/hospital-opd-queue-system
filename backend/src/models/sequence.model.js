const mongoose = require("mongoose");

// One document per department per day, e.g. key "GM-2026-11-22"
const sequenceSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 },
});

// $inc is atomic inside MongoDB, so two patients can never get the same number
sequenceSchema.statics.next = async function (key, retry = true) {
  try {
    const doc = await this.findOneAndUpdate({ key }, { $inc: { value: 1 } }, { new: true, upsert: true });
    return doc.value;
  } catch (err) {
    // two very first requests of the day can race on the upsert; retry once
    if (err.code === 11000 && retry) return this.next(key, false);
    throw err;
  }
};

module.exports = mongoose.model("Sequence", sequenceSchema);
