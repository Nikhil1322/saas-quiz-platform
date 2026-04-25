"use client";
import React, { useEffect, useState } from "react";

type Lead = { id: number; name: string; phone: string; result: string; answers: string; status: string; created_at: string; form_id: number | null };
type Form = { id: number; name: string };

const STATUS_COLOR: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-amber-100 text-amber-700",
  converted: "bg-green-100 text-green-700",
};

const parseAns = (l: Lead): Record<string, any> => {
  try { return JSON.parse(l.answers); } catch { return {}; }
};

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [search, setSearch] = useState("");
  const [formFilter, setFormFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [token, setToken] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token") || "";
    setToken(t);
    if (!t) { window.location.href = "/"; return; }
    const h = { Authorization: `Bearer ${t}` };
    fetch("/api/admin/leads", { headers: h })
      .then(r => { if (r.status === 401) { localStorage.clear(); window.location.href = "/"; } return r.json(); })
      .then(d => setLeads(Array.isArray(d) ? d : []));
    fetch("/api/admin/forms", { headers: h })
      .then(r => r.json()).then(d => setForms(Array.isArray(d) ? d : []));
  }, []);

  const updateStatus = async (id: number, status: string) => {
    await fetch("/api/admin/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status }),
    });
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const filtered = leads.filter(l => {
    const ans = parseAns(l);
    const allText = Object.values(ans).join(" ").toLowerCase() + l.name?.toLowerCase();
    const matchSearch = !search || allText.includes(search.toLowerCase());
    const matchForm = formFilter === "all" || String(l.form_id) === formFilter;
    const matchStatus = statusFilter === "all" || (l.status || "new") === statusFilter;
    return matchSearch && matchForm && matchStatus;
  });

  const totalLeads = leads.length;
  const statusCounts = leads.reduce((acc: Record<string, number>, l) => {
    const s = l.status || "new"; acc[s] = (acc[s] || 0) + 1; return acc;
  }, {});

  // Get all unique answer keys across all leads (for dynamic columns)
  const allKeys = Array.from(new Set(leads.flatMap(l => Object.keys(parseAns(l))))).slice(0, 8);

  const stats = [
    { label: "Total Leads", value: totalLeads, icon: "📋", color: "from-indigo-500 to-indigo-600" },
    { label: "New", value: statusCounts["new"] || 0, icon: "🆕", color: "from-blue-500 to-blue-600" },
    { label: "Contacted", value: statusCounts["contacted"] || 0, icon: "📞", color: "from-amber-500 to-amber-600" },
    { label: "Converted", value: statusCounts["converted"] || 0, icon: "✅", color: "from-green-500 to-green-600" },
  ];

  // Detect any image URL: absolute, relative /uploads/, /api/img/, etc.
  const isImageUrl = (v: any): boolean => {
    if (typeof v !== "string" || !v) return false;
    // Check by file extension first
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)(\?|$)/i.test(v)) return true;
    // Check by known path patterns even without extension
    if (v.startsWith("/uploads/") || v.startsWith("/api/img/") || v.startsWith("/api/uploads/")) return true;
    // Absolute URL with image extension
    if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(v)) return true;
    return false;
  };

  // /uploads/... is proxied by Next.js to the backend — works on localhost AND ngrok
  const resolveImgUrl = (v: string): string => {
    if (v.startsWith("http")) return v;
    // Relative paths like /uploads/response_xxx.png are proxied by next.config.ts
    return v;
  };

  const formatVal = (val: any): React.ReactNode => {
    if (val === null || val === undefined) return "—";
    if (Array.isArray(val)) return val.join(", ");
    if (isImageUrl(val)) {
      const src = resolveImgUrl(val);
      return (
        <a href={src} target="_blank" rel="noreferrer" title="Click to open full image">
          <img
            src={src}
            alt="uploaded image"
            style={{
              width: 56,
              height: 56,
              objectFit: "cover",
              borderRadius: 8,
              border: "2px solid #e5e7eb",
              cursor: "pointer",
              display: "block",
              transition: "transform 0.15s",
            }}
            onMouseOver={e => (e.currentTarget.style.transform = "scale(1.1)")}
            onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}
          />
        </a>
      );
    }
    return String(val);
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/api/admin/export", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        alert("Failed to export leads.");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leads.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error("Export error", e);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">{totalLeads} total leads collected</p>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition shadow-sm">
          ⬇ Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
              <span className="text-xl">{s.icon}</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white shadow-sm"
          placeholder="🔍 Search all answers..." />
        <select value={formFilter} onChange={e => setFormFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white shadow-sm">
          <option value="all">All Forms</option>
          {forms.map(f => <option key={f.id} value={String(f.id)}>{f.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white shadow-sm">
          <option value="all">All Statuses</option>
          <option value="new">🆕 New</option>
          <option value="contacted">📞 Contacted</option>
          <option value="converted">✅ Converted</option>
        </select>
        <span className="text-sm text-gray-500">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Form</th>
                {/* Dynamic columns from actual answer keys */}
                {allKeys.map(k => (
                  <th key={k} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {k.replace(/_/g, " ")}
                  </th>
                ))}
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => {
                const ans = parseAns(item);
                const formName = forms.find(f => f.id === item.form_id)?.name || "—";
                return (
                  <React.Fragment key={item.id}>
                    <tr key={`row-${item.id}`} className="border-t hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">{formName}</span>
                      </td>
                      {/* Render dynamic answer columns */}
                      {allKeys.map(k => (
                        <td key={k} className="px-4 py-3 text-gray-700 max-w-[180px]">
                          <span className="truncate block text-sm">{formatVal(ans[k])}</span>
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <select value={item.status || "new"} onChange={e => updateStatus(item.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-lg border-0 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 ${STATUS_COLOR[item.status || "new"] || STATUS_COLOR.new}`}>
                          <option value="new">🆕 New</option>
                          <option value="contacted">📞 Contacted</option>
                          <option value="converted">✅ Converted</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
                          {expandedId === item.id ? "Hide ▴" : "View ▾"}
                        </button>
                      </td>
                    </tr>
                    {/* Expanded row — shows ALL answers */}
                    {expandedId === item.id && (
                      <tr key={`exp-${item.id}`} className="bg-indigo-50 border-t">
                        <td colSpan={allKeys.length + 5} className="px-6 py-4">
                          <div className="grid grid-cols-3 gap-3">
                            {Object.entries(ans).map(([k, v]) => (
                              <div key={k} className="bg-white rounded-xl p-3 border border-indigo-100">
                                <p className="text-xs text-gray-400 font-medium capitalize mb-1">{k.replace(/_/g, " ")}</p>
                                <p className="text-sm font-semibold text-gray-800">{formatVal(v)}</p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={allKeys.length + 5} className="px-4 py-12 text-center text-gray-400">No leads found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}