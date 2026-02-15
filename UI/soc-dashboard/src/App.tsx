import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const chartData = [
  { time: "07:00", alerts: 2 },
  { time: "08:00", alerts: 5 },
  { time: "09:00", alerts: 3 },
  { time: "10:00", alerts: 7 },
  { time: "11:00", alerts: 4 },
];

function App() {
  const [time, setTime] = useState(new Date());
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(1);
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState([
    "[07:31] Suspicious login detected",
    "[07:33] LSASS memory access detected",
  ]);

  const incidents = [
    { id: 1, title: "Credential Access", severity: "P2", status: "Active", user: "jsmith", host: "WS-01" },
    { id: 2, title: "Ransomware Activity", severity: "P1", status: "Investigating", user: "admin", host: "SRV-02" },
    { id: 3, title: "Data Exfiltration", severity: "P3", status: "Contained", user: "mjones", host: "WS-07" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Monitoring system activity...`,
      ]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const filteredIncidents = incidents
    .filter((i) => (filter === "All" ? true : i.status === filter))
    .filter((i) => i.title.toLowerCase().includes(search.toLowerCase()));

  const currentIncident = incidents.find((i) => i.id === selected);

  return (
    <div className="min-h-screen bg-black text-white font-sans flex">
      {/* SIDEBAR */}
      <div className="w-64 border-r border-white p-6 space-y-6">
        <h2 className="text-lg font-semibold">SOC Console</h2>
        <div className="space-y-2 text-sm text-gray-400">
          <div className="hover:text-white cursor-pointer">Dashboard</div>
          <div className="hover:text-white cursor-pointer">Incidents</div>
          <div className="hover:text-white cursor-pointer">Threat Intel</div>
          <div className="hover:text-white cursor-pointer">Analytics</div>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 p-10 space-y-8">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">Security Operations Center</h1>
          <div className="text-xs text-gray-400">{time.toLocaleTimeString()}</div>
        </div>

        {/* SEARCH */}
        <input
          placeholder="Search incidents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-white bg-black rounded-xl px-4 py-2 text-sm focus:outline-none"
        />

        {/* FILTER */}
        <div className="flex gap-4">
          {["All", "Active", "Investigating", "Contained"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1 rounded-full text-sm border border-white transition ${
                filter === f ? "bg-white text-black" : ""
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ALERT TREND CHART */}
        <div className="border border-white rounded-2xl p-6 h-64">
          <h2 className="text-sm font-semibold mb-4">Alert Trend</h2>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={chartData}>
              <XAxis dataKey="time" stroke="#ffffff" />
              <YAxis stroke="#ffffff" />
              <Tooltip />
              <Line type="monotone" dataKey="alerts" stroke="#ffffff" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* INCIDENT LIST */}
        <div className="grid grid-cols-3 gap-6">
          {filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              onClick={() => setSelected(incident.id)}
              className={`border border-white rounded-xl p-4 cursor-pointer transition ${
                selected === incident.id ? "bg-white text-black" : "hover:border-white"
              }`}
            >
              <div className="font-medium">{incident.title}</div>
              <div className="text-xs mt-1">
                {incident.severity} • {incident.status}
              </div>
            </div>
          ))}
        </div>

        {/* INCIDENT DETAILS */}
        {currentIncident && (
          <motion.div
            key={currentIncident.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-white rounded-2xl p-8 space-y-6"
          >
            <h2 className="text-xl font-semibold">{currentIncident.title}</h2>
            <div className="text-sm text-gray-400">
              User: {currentIncident.user} • Host: {currentIncident.host}
            </div>

            {/* LIVE LOG */}
            <div className="border border-white rounded-xl p-4">
              <div className="text-sm font-semibold mb-2">Live Logs</div>
              <div className="h-32 overflow-y-auto text-xs font-mono text-gray-400 space-y-1">
                {logs.slice(-6).map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-4">
              <button className="bg-white text-black px-4 py-2 rounded-full text-sm">
                Contain
              </button>
              <button className="border border-white px-4 py-2 rounded-full text-sm">
                Escalate
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default App;
