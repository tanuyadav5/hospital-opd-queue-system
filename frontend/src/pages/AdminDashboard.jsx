import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorText } from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import useQueueUpdates from "../hooks/useQueueUpdates.js";

export default function AdminDashboard() {
  const [tokens, setTokens] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [error, setError] = useState("");
  const { logout } = useAuth();
  const navigate = useNavigate();

  // One place to handle failures: expired session -> back to login
  const handleError = useCallback((err) => {
    if (err.response?.status === 401) {
      logout();
      navigate("/admin/login");
    } else {
      setError(errorText(err));
    }
  }, [logout, navigate]);

  const loadTokens = useCallback(async () => {
    try {
      const { data } = await api.get("/tokens");
      setTokens(data);
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  useEffect(() => {
    api.get("/doctors")
      .then(({ data }) => {
        setDoctors(data);
        setDoctorId((current) => current || data[0]?._id || "");
      })
      .catch(handleError);
  }, [handleError]);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  // Refresh instantly when any patient or doctor changes the queue
  useQueueUpdates(loadTokens);

  const callNext = async () => {
    setError("");
    try {
      await api.patch("/tokens/call-next", { doctorId });
      loadTokens();
    } catch (err) {
      handleError(err);
    }
  };

  const setStatus = async (id, status) => {
    try {
      await api.patch(`/tokens/${id}/status`, { status });
      loadTokens();
    } catch (err) {
      handleError(err);
    }
  };

  const doctor = doctors.find((d) => d._id === doctorId);
  const serving = tokens.find((t) => t.status === "serving" && t.doctor?._id === doctorId);
  const waiting = tokens.filter((t) => t.status === "waiting" && t.department?._id === doctor?.department?._id).length;

  return (
    <>
      <section className="panel board">
        <div>
          <label htmlFor="doctor">Doctor</label>
          <select id="doctor" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>{d.name} ({d.department?.code}, {d.room})</option>
            ))}
          </select>
        </div>
        <div><div>Now serving</div><div className="now">{serving ? serving.tokenCode : "-"}</div></div>
        <div><div>Waiting in {doctor?.department?.name ?? "department"}</div><div className="now">{waiting}</div></div>
        <button onClick={callNext} disabled={!doctorId}>Call next</button>
      </section>
      <p className="message">{error}</p>

      <section className="panel">
        <h2>Today's tokens</h2>
        {tokens.length === 0 ? (
          <p>No tokens yet today.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Token</th><th>Patient</th><th>Priority</th><th>Status</th><th>Doctor</th><th></th></tr>
            </thead>
            <tbody>
              {tokens.map((t) => (
                <tr key={t._id} className={t.status === "serving" ? "row-serving" : ""}>
                  <td>{t.tokenCode}</td>
                  <td>{t.patientName}</td>
                  <td><span className={`badge ${t.priority}`}>{t.priority}</span></td>
                  <td>{t.status}</td>
                  <td>{t.doctor?.name ?? "-"}</td>
                  <td className="actions">
                    {t.status === "serving" && <button className="small ok" onClick={() => setStatus(t._id, "completed")}>Complete</button>}
                    {["waiting", "serving"].includes(t.status) && <button className="small danger" onClick={() => setStatus(t._id, "cancelled")}>Cancel</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
