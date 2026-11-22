// npm run seed             -> admin + departments + doctors (safe to re-run)
// npm run seed -- --reset  -> also deletes old tokens (needed once after Phase 1)
require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("./models/admin.model");
const Department = require("./models/department.model");
const Doctor = require("./models/doctor.model");
const Token = require("./models/token.model");
const Sequence = require("./models/sequence.model");

const DEPARTMENTS = [
  { name: "General Medicine", code: "GM", avgConsultMinutes: 10 },
  { name: "Orthopedics", code: "OR", avgConsultMinutes: 15 },
  { name: "Pediatrics", code: "PD", avgConsultMinutes: 12 },
  { name: "Dermatology", code: "DM", avgConsultMinutes: 8 },
];
const DOCTORS = [
  ["Dr. Sharma", "GM", "Room 1"],
  ["Dr. Verma", "GM", "Room 2"],
  ["Dr. Khan", "OR", "Room 3"],
  ["Dr. Iyer", "PD", "Room 4"],
  ["Dr. Gupta", "DM", "Room 5"],
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  if (process.argv.includes("--reset")) {
    await Token.deleteMany({});
    await Sequence.deleteMany({});
    console.log("Old tokens cleared");
  }

  const username = process.env.ADMIN_USERNAME || "admin";
  if (!(await Admin.findOne({ username }))) {
    await Admin.create({ username, password: process.env.ADMIN_PASSWORD || "admin123" });
    console.log(`Admin "${username}" created`);
  }

  const staffName = process.env.STAFF_USERNAME || "staff";
  if (!(await Admin.findOne({ username: staffName }))) {
    await Admin.create({ username: staffName, password: process.env.STAFF_PASSWORD || "staff123", role: "staff" });
    console.log(`Staff user "${staffName}" created`);
  }

  for (const d of DEPARTMENTS) {
    await Department.updateOne({ code: d.code }, { $setOnInsert: d }, { upsert: true });
  }

  if ((await Doctor.countDocuments()) === 0) {
    const depts = await Department.find();
    const byCode = Object.fromEntries(depts.map((d) => [d.code, d._id]));
    await Doctor.insertMany(DOCTORS.map(([name, code, room]) => ({ name, department: byCode[code], room })));
    console.log("Doctors created");
  }

  console.log("Seed complete");
  await mongoose.disconnect();
})();
