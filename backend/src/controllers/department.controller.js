const Department = require("../models/department.model");
const Token = require("../models/token.model");
const { startOfToday } = require("../utils/date");

// GET /api/departments -> list with today's waiting count
exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 }).lean();
    const counts = await Token.aggregate([
      { $match: { status: "waiting", createdAt: { $gte: startOfToday() } } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
    ]);
    const waitingBy = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

    res.json(departments.map((d) => ({ ...d, waiting: waitingBy[String(d._id)] || 0 })));
  } catch (err) {
    next(err);
  }
};

// GET /api/departments/display -> public data for the waiting-hall screen.
// Only token codes, doctor and room are sent. Patient names stay private.
exports.getDisplay = async (req, res, next) => {
  try {
    const [departments, tokens] = await Promise.all([
      Department.find().sort({ name: 1 }).lean(),
      Token.find({ createdAt: { $gte: startOfToday() }, status: { $in: ["waiting", "serving"] } })
        .sort({ priorityRank: 1, tokenNumber: 1 })
        .populate("doctor", "name room")
        .lean(),
    ]);

    res.json(
      departments.map((d) => {
        const mine = tokens.filter((t) => String(t.department) === String(d._id));
        const waiting = mine.filter((t) => t.status === "waiting");
        return {
          _id: d._id,
          name: d.name,
          serving: mine
            .filter((t) => t.status === "serving")
            .map((t) => ({ tokenCode: t.tokenCode, doctor: t.doctor?.name, room: t.doctor?.room })),
          next: waiting.slice(0, 3).map((t) => t.tokenCode),
          waitingCount: waiting.length,
        };
      })
    );
  } catch (err) {
    next(err);
  }
};
