import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { errorText } from "../api/axios.js";
import useQueueUpdates from "../hooks/useQueueUpdates.js";

const Stat = ({ label, value }) => (
  <div className="stat">
    <div className="stat-value">{value}</div>
    <div>{label}</div>
  </div>
);

const TotalsChart = ({ data, xKey }) => (
  <div style={{ height: 260 }}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="total" name="Tokens" fill="#0f5c8c" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/analytics?days=7");
      setData(res.data);
      setError("");
    } catch (err) {
      setError(errorText(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useQueueUpdates(load);

  if (error) return <p className="message">{error}</p>;
  if (!data) return <p>Loading...</p>;

  const { today, byDepartment, daily } = data;

  return (
    <>
      <section className="panel">
        <h2>Today</h2>
        <div className="stats">
          <Stat label="Tokens" value={today.total} />
          <Stat label="Waiting" value={today.waiting} />
          <Stat label="Completed" value={today.completed} />
          <Stat label="Avg wait (min)" value={today.avgWaitMinutes ?? "-"} />
        </div>
      </section>

      <section className="panel">
        <h2>Tokens by department (last {data.days} days)</h2>
        <TotalsChart data={byDepartment} xKey="name" />
      </section>

      <section className="panel">
        <h2>Tokens per day</h2>
        <TotalsChart data={daily} xKey="date" />
      </section>

      <section className="panel">
        <h2>Average wait by department</h2>
        <table>
          <thead><tr><th>Department</th><th>Tokens</th><th>Avg wait (min)</th></tr></thead>
          <tbody>
            {byDepartment.map((d) => (
              <tr key={d.name}><td>{d.name}</td><td>{d.total}</td><td>{d.avgWait ?? "-"}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
