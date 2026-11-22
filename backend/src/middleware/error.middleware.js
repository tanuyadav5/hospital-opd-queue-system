exports.notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

exports.errorHandler = (err, req, res, next) => {
  console.error(err);
  const status = err.name === "CastError" ? 400 : 500;
  res.status(status).json({ message: err.name === "CastError" ? "Invalid id" : "Server error" });
};
