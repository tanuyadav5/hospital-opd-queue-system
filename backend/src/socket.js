const { Server } = require("socket.io");

let io = null;

exports.init = (httpServer) => {
  io = new Server(httpServer);
  return io;
};

// Tell every connected screen "the queue changed, fetch fresh data".
// Only a signal is sent, never patient data, so no login is needed on the socket.
exports.notifyQueueUpdate = () => {
  if (io) io.emit("queue:updated");
};
