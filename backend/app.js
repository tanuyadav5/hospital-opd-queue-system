const path = require("path");
const express = require("express");
const helmet = require("helmet");
const authRoutes = require("./src/routes/auth.routes");
const departmentRoutes = require("./src/routes/department.routes");
const doctorRoutes = require("./src/routes/doctor.routes");
const tokenRoutes = require("./src/routes/token.routes");
const analyticsRoutes = require("./src/routes/analytics.routes");
const { notFound, errorHandler } = require("./src/middleware/error.middleware");

// The Express app lives here (without listen) so tests can import it
const app = express();

app.set("trust proxy", 1); // needed behind Render/Heroku so rate limiting sees real IPs
app.use(helmet()); // secure HTTP headers
app.use(express.json({ limit: "10kb" })); // reject oversized bodies

app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/tokens", tokenRoutes);
app.use("/api/analytics", analyticsRoutes);

// In production one server serves both the API and the built React app
if (process.env.NODE_ENV === "production") {
  const dist = path.join(__dirname, "..", "frontend", "dist");
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
