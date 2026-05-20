import { useEffect, useState } from "react";

type HealthResponse = {
  status: string;
  service: string;
};

export default function App() {
  const [apiStatus, setApiStatus] = useState<string>("checking…");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<HealthResponse>;
      })
      .then((data) => setApiStatus(`${data.service} — ${data.status}`))
      .catch(() => setApiStatus("unreachable (start backend on :8000)"));
  }, []);

  return (
    <main className="app">
      <header>
        <p className="eyebrow">VirtuAll VA · Proof of Concept</p>
        <h1>Leasing Operations Dashboard</h1>
        <p className="subtitle">
          Upload property management exports and turn raw leasing data into
          operational insights.
        </p>
      </header>
      <section className="status-card">
        <span className="label">API</span>
        <span className="value">{apiStatus}</span>
      </section>
    </main>
  );
}
