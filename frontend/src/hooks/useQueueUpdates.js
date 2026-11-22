import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

// Calls onUpdate() whenever the server says the queue changed.
// Also runs it after every (re)connect, and every 30s as a safety net.
export default function useQueueUpdates(onUpdate) {
  const latest = useRef(onUpdate);
  useEffect(() => {
    latest.current = onUpdate;
  });

  useEffect(() => {
    const socket = io();
    socket.on("queue:updated", () => latest.current());
    socket.on("connect", () => latest.current());
    const fallback = setInterval(() => latest.current(), 30000);

    return () => {
      clearInterval(fallback);
      socket.disconnect();
    };
  }, []);
}
