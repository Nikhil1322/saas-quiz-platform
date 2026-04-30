"use client";
import React, { useEffect, useState } from "react";

type Lead = { id: number; name: string; phone: string; result: string; answers: string; status: string; created_at: string; form_id: number | null };
type Form = { id: number; name: string };
type Booking = { id: number; customer_name: string; customer_email: string; booking_date: string; booking_time: string; status: string };

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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [formFilter, setFormFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [token, setToken] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("merchant_token") || "";
    setToken(t);
    if (!t) { window.location.href = "/"; return; }
    const h = { Authorization: `Bearer ${t}` };
    
    Promise.all([
        fetch("/api/admin/leads", { headers: h }).then(r => r.json()),
        fetch("/api/admin/forms", { headers: h }).then(r => r.json()),
        fetch("/api/admin/bookings", { headers: h }).then(r => r.json())
    ]).then(([leadsData, formsData, bookingsData]) => {
        setLeads(Array.isArray(leadsData) ? leadsData : []);
        setForms(Array.isArray(formsData) ? formsData : []);
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
        setLoading(false);
    }).catch(() => setLoading(false));
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

  const allKeys = Array.from(new Set(leads.flatMap(l => Object.keys(parseAns(l))))).slice(0, 8);

  const stats = [
    { label: "Total Leads", value: totalLeads, icon: "📋", color: "from-blue-600 to-indigo-700", shadow: "shadow-blue-200" },
    { label: "Total Bookings", value: bookings.length, icon: "📅", color: "from-purple-600 to-pink-600", shadow: "shadow-purple-200" },
    { label: "New Leads", value: statusCounts["new"] || 0, icon: "🆕", color: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-200" },
    { label: "Converted", value: statusCounts["converted"] || 0, icon: "✨", color: "from-orange-500 to-red-600", shadow: "shadow-orange-200" },
  ];

  const today = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.booking_date === today && b.status !== 'cancelled');
  const upcomingBookings = bookings.filter(b => b.booking_date >= today && b.status !== 'cancelled').slice(0, 3);

  const isImageUrl = (v: any): boolean => {
    if (typeof v !== "string" || !v) return false;
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)(\?|$)/i.test(v)) return true;
    if (v.startsWith("/uploads/") || v.startsWith("/api/img/") || v.startsWith("/api/uploads/")) return true;
    if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(v)) return true;
    return false;
  };

  const formatVal = (val: any): React.ReactNode => {
    if (val === null || val === undefined) return "—";
    if (Array.isArray(val)) return val.join(", ");
    if (isImageUrl(val)) {
      const src = val;
      return (
        <a href={src} target="_blank" rel="noreferrer">
          <img src={src} alt="upload" className="w-10 h-10 object-cover rounded-lg border hover:scale-110 transition" />
        </a>
      );
    }
    return String(val);
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading dashboard...</div>;

  return (
    <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Overview</h1>
          <p className="text-gray-500 font-medium">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => window.location.href = "/dashboard/bookings"} 
            className="bg-white border border-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-2xl hover:bg-gray-50 transition shadow-sm flex items-center gap-2">
            📅 Manage Calendar
          </button>
          <button onClick={() => window.location.href = "/dashboard/forms"}
            className="bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-2xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center gap-2">
            ➕ Create New Form
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(s => (
          <div key={s.label} className={`bg-white rounded-3xl p-6 border border-gray-100 shadow-xl ${s.shadow} flex flex-col gap-4 relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${s.color} opacity-5 -mr-8 -mt-8 rounded-full group-hover:scale-150 transition-transform duration-500`} />
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-xl shadow-lg`}>
              {s.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-4xl font-black text-gray-900 mt-1">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Leads Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between bg-white">
                <h3 className="text-xl font-bold text-gray-900">Recent Leads</h3>
                <div className="flex items-center gap-2">
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        className="bg-gray-50 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 w-48"
                        placeholder="Search..." />
                </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-500 font-bold border-b">
                    <th className="px-6 py-4 text-left">Customer</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.slice(0, 10).map((item) => {
                    const ans = parseAns(item);
                    const isExp = expandedId === item.id;
                    return (
                      <React.Fragment key={item.id}>
                        <tr className={`hover:bg-gray-50/50 transition cursor-pointer ${isExp ? 'bg-indigo-50/30' : ''}`} onClick={() => setExpandedId(isExp ? null : item.id)}>
                          <td className="px-6 py-4">
                              <div className="font-bold text-gray-900">{item.name || ans.name || "Anonymous"}</div>
                              <div className="text-xs text-gray-500">{item.phone || ans.phone || "No phone"}</div>
                          </td>
                          <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLOR[item.status || 'new']}`}>
                                  {item.status?.toUpperCase() || 'NEW'}
                              </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs font-medium">
                              {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                              <span className="text-indigo-600 font-bold hover:underline">
                                  {isExp ? 'Close' : 'View Details'}
                              </span>
                          </td>
                        </tr>
                        {isExp && (
                          <tr className="bg-white border-b">
                            <td colSpan={4} className="px-6 py-6 animate-in slide-in-from-top-2 duration-300">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(ans).map(([k, v]) => (
                                  <div key={k} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{k.replace(/_/g, ' ')}</span>
                                    <div className="text-sm font-bold text-gray-800 break-words">
                                      {formatVal(v)}
                                    </div>
                                  </div>
                                ))}
                                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col gap-3">
                                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Update Lead Status</span>
                                  <div className="flex gap-2">
                                    {['new', 'contacted', 'converted'].map(s => (
                                      <button 
                                         key={s} 
                                         onClick={(e) => { e.stopPropagation(); updateStatus(item.id, s); }}
                                         className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${item.status === s ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}
                                      >
                                        {s}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Appointments Highlights */}
        <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Today's Agenda</h3>
                    <span className="bg-rose-100 text-rose-600 text-xs font-black px-2.5 py-1 rounded-full uppercase">
                        {todayBookings.length} Bookings
                    </span>
                </div>

                <div className="space-y-4">
                    {todayBookings.length > 0 ? todayBookings.map(b => (
                        <div key={b.id} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-indigo-200 transition group cursor-pointer">
                            <div className="w-12 h-12 rounded-xl bg-white border shadow-sm flex flex-col items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <span className="text-xs font-black">{b.booking_time.split(':')[0]}</span>
                                <span className="text-[10px] font-bold opacity-70">AM</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 truncate">{b.customer_name}</p>
                                <p className="text-xs text-gray-500 font-medium">{b.booking_time} • 30 mins</p>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2" />
                        </div>
                    )) : (
                        <div className="py-12 text-center space-y-3">
                            <div className="text-4xl">☕</div>
                            <p className="text-sm font-bold text-gray-400">No bookings for today. Relax!</p>
                        </div>
                    )}
                </div>

                <hr className="border-gray-100" />

                <div>
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Upcoming Next</h4>
                    <div className="space-y-3">
                        {upcomingBookings.map(b => (
                            <div key={b.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                        {b.booking_date.split('-')[2]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{b.customer_name}</p>
                                        <p className="text-[10px] text-gray-400 font-bold">{new Date(b.booking_date).toDateString()}</p>
                                    </div>
                                </div>
                                <button className="text-gray-300 hover:text-indigo-600 transition">
                                    <span className="text-xl">→</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={() => window.location.href = "/dashboard/bookings"} 
                    className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200">
                    Full Calendar View
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
