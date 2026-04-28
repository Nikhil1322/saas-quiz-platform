"use client";
import { useState, useEffect } from "react";

type EventType = {
  id: number;
  title: string;
  description: string;
  duration_mins: number;
  price: number;
  slug: string;
  is_active: boolean;
};

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<EventType | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration_mins: 30,
    price: 0,
  });
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchEventTypes();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem("merchant_token");
    const res = await fetch("/api/admin/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setProfile(data);
  };

  const fetchEventTypes = async () => {
    const token = localStorage.getItem("merchant_token");
    const res = await fetch("/api/admin/event-types", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setEventTypes(await res.json());
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem("merchant_token");
    const url = editing ? `/api/admin/event-types/${editing.id}` : "/api/admin/event-types";
    const method = editing ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          setModalOpen(false);
          setEditing(null);
          setFormData({ title: "", description: "", duration_mins: 30, price: 0 });
          fetchEventTypes();
        } else {
            const err = await res.json();
            console.error("Server Error:", err);
            alert("Error: " + (err.msg || "Failed to save event type"));
        }
    } catch (err: any) {
        console.error("Network Error:", err);
        alert(`Network error: ${err.message || 'Unknown failure'}. Please check your connection and ensure the backend is running.`);
    } finally {
        setSubmitting(false);
    }
  };

  const deleteEventType = async (id: number) => {
    if (!confirm("Delete this event type?")) return;
    const token = localStorage.getItem("merchant_token");
    const res = await fetch(`/api/admin/event-types/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchEventTypes();
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Booking Settings</h1>
          <p className="text-gray-500 font-medium">Manage your event types and custom booking links.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormData({ title: "", description: "", duration_mins: 30, price: 0 }); setModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-8 rounded-[24px] shadow-2xl shadow-indigo-200 transition-all active:scale-95 uppercase tracking-widest text-xs"
        >
          + Create Event Type
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-gray-100 rounded-[40px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {eventTypes.map((et) => (
            <div key={et.id} className="bg-white border-2 border-gray-50 rounded-[40px] p-8 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-3xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    ⚡
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(et); setFormData(et); setModalOpen(true); }} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                      ✏️
                    </button>
                    <button onClick={() => deleteEventType(et.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                      🗑️
                    </button>
                  </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mt-6 leading-tight tracking-tight">{et.title}</h3>
                <p className="text-gray-400 text-sm mt-3 font-medium line-clamp-2 leading-relaxed">{et.description || "No description provided."}</p>
                
                <div className="flex flex-wrap items-center gap-3 mt-8">
                  <div className="bg-gray-50 px-4 py-2 rounded-2xl flex items-center gap-2 border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time</span>
                    <span className="text-gray-900 font-black text-sm">{et.duration_mins}m</span>
                  </div>
                  {et.price > 0 && (
                    <div className="bg-emerald-50 px-4 py-2 rounded-2xl flex items-center gap-2 border border-emerald-100">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Cost</span>
                      <span className="text-emerald-700 font-black text-sm">₹{et.price}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-10 pt-8 border-t-2 border-gray-50 flex flex-col gap-4">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shareable Booking Link</p>
                 {profile?.subdomain ? (
                   <>
                     <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100 shadow-inner">
                        <input 
                          readOnly 
                          value={`${origin}/book/${profile.subdomain}/${et.slug}`} 
                          className="bg-transparent text-[11px] text-gray-500 flex-1 outline-none font-black truncate"
                        />
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${origin}/book/${profile.subdomain}/${et.slug}`);
                            alert("✅ Copied to clipboard!");
                          }}
                          className="bg-white text-[10px] font-black px-4 py-2 rounded-xl border-2 border-gray-100 shadow-sm hover:border-indigo-500 hover:text-indigo-600 transition-all active:scale-95"
                        >
                          COPY
                        </button>
                     </div>
                     <a 
                       href={`/book/${profile.subdomain}/${et.slug}`} 
                       target="_blank"
                       className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-2xl transition-all uppercase tracking-widest"
                     >
                       View Page ↗
                     </a>
                   </>
                 ) : (
                   <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
                      <p className="text-[10px] font-black text-amber-600 uppercase mb-2">Subdomain Missing</p>
                      <a href="/dashboard/profile" className="text-xs font-bold text-amber-800 underline">Set your subdomain in Profile to enable links</a>
                   </div>
                 )}
              </div>
            </div>
          ))}

          {eventTypes.length === 0 && (
            <div className="col-span-full py-32 text-center bg-gray-50 rounded-[60px] border-4 border-dashed border-gray-100">
              <div className="text-6xl mb-6">🗓️</div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">No event types yet</h3>
              <p className="text-gray-400 font-medium mt-2">Create your first event type to start taking appointments.</p>
              <button
                onClick={() => { setEditing(null); setModalOpen(true); }}
                className="mt-8 bg-indigo-600 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-indigo-100"
              >
                + Create Now
              </button>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[50px] p-12 max-w-xl w-full shadow-[0_0_100px_-20px_rgba(79,70,229,0.2)] animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">{editing ? "Edit Event Type" : "Create Event Type"}</h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Event Title</label>
                <input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 1-on-1 Consultation"
                  className="w-full bg-gray-50 border-2 border-gray-50 rounded-3xl px-8 py-5 text-lg font-bold text-gray-900 focus:border-indigo-500 focus:bg-white transition-all outline-none placeholder:text-gray-300"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What should clients expect from this session?"
                  className="w-full bg-gray-50 border-2 border-gray-50 rounded-3xl px-8 py-5 text-lg font-bold text-gray-900 focus:border-indigo-500 focus:bg-white transition-all outline-none h-40 placeholder:text-gray-300 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Duration (min)</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.duration_mins}
                      onChange={(e) => setFormData({ ...formData, duration_mins: parseInt(e.target.value) || 0 })}
                      className="w-full bg-gray-50 border-2 border-gray-50 rounded-3xl px-8 py-5 text-lg font-black text-gray-900 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                    />
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs uppercase">min</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Price (Optional)</label>
                  <div className="relative">
                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 font-black text-lg">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-gray-50 border-2 border-gray-50 rounded-3xl pl-14 pr-8 py-5 text-lg font-black text-gray-900 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black py-5 rounded-3xl transition-all uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-black py-5 px-10 rounded-3xl shadow-2xl shadow-indigo-200 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
                >
                  {submitting ? "Saving..." : editing ? "Save Changes" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
