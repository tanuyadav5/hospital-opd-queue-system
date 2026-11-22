import { useCallback, useEffect, useState } from "react";
import api from "../api/axios.js";
import useQueueUpdates from "../hooks/useQueueUpdates.js";

// Full-screen board for the waiting hall TV: open /display
export default function DisplayBoard() {
  const [departments, setDepartments] = useState([]);
  const [now, setNow] = useState(new Date());

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/departments/display");
      setDepartments(data);
    } catch (err) {
      // keep showing the last data if a refresh fails
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useQueueUpdates(load);

  return (
    <div className="display">
      <div className="display-head">
        <h1>OPD Queue Status</h1>
        <div className="clock">{now.toLocaleTimeString()}</div>
      </div>

      <div className="display-grid">
        {departments.map((d) => (
          <section key={d._id} className="dcard">
            <h2>{d.name}</h2>
            <div className="label">Now serving</div>
            {d.serving.length === 0 ? (
              <div className="idle">-</div>
            ) : (
              d.serving.map((s) => (
                <div className="serving-row" key={s.tokenCode}>
                  <span className="code">{s.tokenCode}</span>
                  <span>{s.doctor} · {s.room}</span>
                </div>
              ))
            )}
            <div className="label">Next</div>
            <div className="next">{d.next.length ? d.next.join("   ") : "-"}</div>
            <div className="label">{d.waitingCount} waiting</div>
          </section>
        ))}
      </div>
    </div>
  );
}
