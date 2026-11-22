const Token = require("../models/token.model");
const { STATUSES, PRIORITY_RANK } = require("../models/token.model");
const Department = require("../models/department.model");
const Doctor = require("../models/doctor.model");
const Sequence = require("../models/sequence.model");
const { startOfToday, todayKey } = require("../utils/date");
const { notifyQueueUpdate } = require("../socket");

const populateToken = (query) =>
  query.populate("department", "name code avgConsultMinutes").populate("doctor", "name room");

// POST /api/tokens -> patient takes a token
exports.createToken = async (req, res, next) => {
  try {
    const { patientName, phone, department, priority = "normal" } = req.body;
    if (!patientName || !department) {
      return res.status(400).json({ message: "Patient name and department are required" });
    }
    if (!(priority in PRIORITY_RANK)) {
      return res.status(400).json({ message: "Invalid priority" });
    }

    const dept = await Department.findById(department);
    if (!dept) return res.status(404).json({ message: "Department not found" });

    // Atomic counter: one sequence per department per day
    const tokenNumber = await Sequence.next(`${dept.code}-${todayKey()}`);
    const token = await Token.create({
      tokenNumber,
      tokenCode: `${dept.code}-${String(tokenNumber).padStart(3, "0")}`,
      patientName,
      phone,
      department: dept._id,
      priority,
      priorityRank: PRIORITY_RANK[priority],
    });

    notifyQueueUpdate();
    res.status(201).json(token);
  } catch (err) {
    next(err);
  }
};

// GET /api/tokens?department=<id> -> today's tokens (admin)
exports.getTokens = async (req, res, next) => {
  try {
    const filter = { createdAt: { $gte: startOfToday() } };
    if (req.query.department) filter.department = req.query.department;

    const tokens = await populateToken(Token.find(filter).sort({ createdAt: 1 }));
    res.json(tokens);
  } catch (err) {
    next(err);
  }
};

// GET /api/tokens/:id -> patient checks own status, position and wait time
exports.getTokenById = async (req, res, next) => {
  try {
    const token = await populateToken(Token.findById(req.params.id));
    if (!token) return res.status(404).json({ message: "Token not found" });

    const deptId = token.department._id;
    let peopleAhead = 0;
    let estimatedWaitMinutes = 0;

    if (token.status === "waiting") {
      // ahead = higher priority, or same priority and earlier number
      peopleAhead = await Token.countDocuments({
        department: deptId,
        status: "waiting",
        createdAt: { $gte: startOfToday() },
        $or: [
          { priorityRank: { $lt: token.priorityRank } },
          { priorityRank: token.priorityRank, tokenNumber: { $lt: token.tokenNumber } },
        ],
      });
      const doctorCount = Math.max(await Doctor.countDocuments({ department: deptId }), 1);
      estimatedWaitMinutes = Math.ceil((peopleAhead * token.department.avgConsultMinutes) / doctorCount);
    }

    const serving = await Token.findOne({
      department: deptId,
      status: "serving",
      createdAt: { $gte: startOfToday() },
    }).sort({ updatedAt: -1 });

    res.json({ token, peopleAhead, estimatedWaitMinutes, nowServing: serving ? serving.tokenCode : null });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tokens/call-next { doctorId } -> a doctor calls the next patient (admin)
exports.callNext = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.body.doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const today = { createdAt: { $gte: startOfToday() } };

    // finish this doctor's current patient
    await Token.updateMany({ ...today, doctor: doctor._id, status: "serving" }, { status: "completed" });

    // Priority queue: emergency, then senior, then normal; first come first served inside each.
    // findOneAndUpdate is atomic, so two doctors can never pick the same patient.
    const nextToken = await populateToken(
      Token.findOneAndUpdate(
        { ...today, department: doctor.department, status: "waiting" },
        { status: "serving", doctor: doctor._id, calledAt: new Date() },
        { sort: { priorityRank: 1, tokenNumber: 1 }, new: true }
      )
    );

    if (!nextToken) return res.status(404).json({ message: "No patients waiting in this department" });
    notifyQueueUpdate();
    res.json(nextToken);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tokens/:id/status -> mark completed / cancelled (admin)
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${STATUSES.join(", ")}` });
    }

    const token = await Token.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!token) return res.status(404).json({ message: "Token not found" });
    notifyQueueUpdate();
    res.json(token);
  } catch (err) {
    next(err);
  }
};
