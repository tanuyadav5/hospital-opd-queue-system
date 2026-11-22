const Token = require("../models/token.model");
const Department = require("../models/department.model");
const { startOfToday } = require("../utils/date");

const TZ = process.env.TZ || "Asia/Kolkata";

// Minutes between taking a token and being called (only for called tokens)
const waitMinutes = {
  $cond: [{ $ifNull: ["$calledAt", false] }, { $divide: [{ $subtract: ["$calledAt", "$createdAt"] }, 60000] }, null],
};

const round1 = (n) => (n == null ? null : Math.round(n * 10) / 10);

// GET /api/analytics?days=7 (admin only)
exports.getAnalytics = async (req, res, next) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 30);
    const todayStart = startOfToday();
    const since = startOfToday();
    since.setDate(since.getDate() - (days - 1));

    const [statusCounts, todayWait, byDepartment, daily] = await Promise.all([
      Token.aggregate([
        { $match: { createdAt: { $gte: todayStart } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Token.aggregate([
        { $match: { createdAt: { $gte: todayStart } } },
        { $group: { _id: null, avgWait: { $avg: waitMinutes } } },
      ]),
      Token.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$department", total: { $sum: 1 }, avgWait: { $avg: waitMinutes } } },
        { $lookup: { from: Department.collection.name, localField: "_id", foreignField: "_id", as: "dept" } },
        { $unwind: "$dept" },
        { $project: { _id: 0, name: "$dept.name", total: 1, avgWait: 1 } },
        { $sort: { total: -1 } },
      ]),
      Token.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } }, total: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", total: 1 } },
      ]),
    ]);

    const counts = Object.fromEntries(statusCounts.map((s) => [s._id, s.count]));
    res.json({
      days,
      today: {
        total: statusCounts.reduce((sum, s) => sum + s.count, 0),
        waiting: counts.waiting || 0,
        serving: counts.serving || 0,
        completed: counts.completed || 0,
        cancelled: counts.cancelled || 0,
        avgWaitMinutes: round1(todayWait[0]?.avgWait),
      },
      byDepartment: byDepartment.map((d) => ({ ...d, avgWait: round1(d.avgWait) })),
      daily,
    });
  } catch (err) {
    next(err);
  }
};
