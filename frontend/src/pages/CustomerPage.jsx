import { useCallback, useEffect, useState } from "react";
import api, { errorText } from "../api/axios.js";
import useQueueUpdates from "../hooks/useQueueUpdates.js";

const PRIORITIES = [
  ["normal", "Normal"],
  ["senior", "Senior citizen (60+)"],
  ["emergency", "Emergency"],
];
const EMPTY_FORM = { patientName: "", phone: "", department: "", priority: "normal" };

export default function CustomerPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [departments, setDepartments] = useState([]);
  const [tokenId, setTokenId] = useState(localStorage.getItem("tokenId"));
  const [info, setInfo] = useState(null); // { token, peopleAhead, estimatedWaitMinutes, nowServing }
  const [error, setError] = useState("");

  const clearTicket = () => {
    localStorage.removeItem("tokenId");
    setTokenId(null);
    setInfo(null);
  };

  const loadDepartments = useCallback(async () => {
    try {
      const { data } = await api.get("/departments");
      setDepartments(data);
    } catch (err) {
      setError(errorText(err));
    }
  }, []);

  const loadTicket = useCallback(async () => {
    if (!tokenId) return;
    try {
      const { data } = await api.get(`/tokens/${tokenId}`);
      setInfo(data);
    } catch (err) {
      clearTicket(); // saved token no longer exists
    }
  }, [tokenId]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  // Server pushes "queue:updated" -> refresh counts and my ticket (no 5s polling)
  useQueueUpdates(() => {
    loadDepartments();
    loadTicket();
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/tokens", form);
      localStorage.setItem("tokenId", data._id);
      setTokenId(data._id);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(errorText(err));
    }
  };

  if (tokenId && info) {
    const { token, peopleAhead, estimatedWaitMinutes, nowServing } = info;
    const details = {
      waiting: `${peopleAhead} ${peopleAhead === 1 ? "patient" : "patients"} ahead. Estimated wait: about ${estimatedWaitMinutes} min`,
      serving: `Please go to ${token.doctor?.name ?? "the doctor"}${token.doctor?.room ? `, ${token.doctor.room}` : ""}`,
      completed: "Your consultation is complete. Get well soon.",
      cancelled: "This token was cancelled.",
    };

    return (
      <section className="panel">
        <div className="ticket">
          <div className="info">{token.department.name}</div>
          <div className="number">{token.tokenCode}</div>
          <div className="info">{token.patientName}</div>
          <span className={`badge ${token.status}`}>{token.status}</span>{" "}
          {token.priority !== "normal" && <span className={`badge ${token.priority}`}>{token.priority}</span>}
          <p className="info">{details[token.status]}</p>
          <p className="info">Now serving in this department: <strong>{nowServing ?? "-"}</strong></p>
        </div>
        <button className="small" style={{ marginTop: 14 }} onClick={clearTicket}>Get another token</button>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>OPD token</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="patientName">Patient name</label>
        <input id="patientName" name="patientName" value={form.patientName} onChange={handleChange} required maxLength={60} />
        <label htmlFor="phone">Phone (optional)</label>
        <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} maxLength={15} />
        <label htmlFor="department">Department</label>
        <select id="department" name="department" value={form.department} onChange={handleChange} required>
          <option value="">Choose a department</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>{d.name} ({d.waiting} waiting)</option>
          ))}
        </select>
        <label htmlFor="priority">Priority</label>
        <select id="priority" name="priority" value={form.priority} onChange={handleChange}>
          {PRIORITIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button type="submit">Get token</button>
        <p className="message">{error}</p>
      </form>
    </section>
  );
}
