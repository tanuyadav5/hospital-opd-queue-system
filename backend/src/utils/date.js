exports.startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// "2026-11-22" in local time; used as part of the daily counter key
exports.todayKey = () => new Date().toLocaleDateString("en-CA");
