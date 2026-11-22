require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./src/config/db");
const { init: initSocket } = require("./src/socket");

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Add it to your environment variables.");
  process.exit(1);
}

// Socket.io needs the raw HTTP server, not just the Express app
const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
});
