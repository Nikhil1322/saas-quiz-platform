"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Form = {
  id: number;
  name: string;
  type: "quiz" | "lead_gen" | "survey" | "nps" | "contact";
  status: "draft" | "published";
  lead_count: number;
  updated_at: string;
};

const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  quiz:     { label: "Quiz",        icon: "🧠", color: "bg-purple-100 text-purple-700" },
  lead_gen: { label: "Lead Gen",    icon: "🎯", color: "bg-blue-100 text-blue-700" },
  survey:   { label: "Survey",      icon: "📊", color: "bg-amber-100 text-amber-700" },
  nps:      { label: "NPS",         icon: "⭐", color: "bg-green-100 text-green-700" },
  contact:  { label: "Contact",     icon: "✉️",  color: "bg-rose-100 text-rose-700" },
};

const DEFAULT_CONFIGS: Record<string, object> = {
  quiz:     { title: "New Quiz", description: "Discover your perfect match", logoUrl: "", theme: { primaryColor: "#6366f1", bgColor: "#ffffff", textColor: "#111827", buttonStyle: "rounded" }, questions: [], welcomeBtn: "Start Quiz →", thankYouTitle: "You're all set! 🎉", thankYouDesc: "We'll be in touch shortly.", buttonText: "Continue →", submitText: "Get My Results ✨" },
  lead_gen: { title: "Get Your Free Guide", description: "Fill out the form below", logoUrl: "", theme: { primaryColor: "#3b82f6", bgColor: "#ffffff", textColor: "#111827", buttonStyle: "rounded" }, questions: [], welcomeBtn: "Start →", thankYouTitle: "Thank You! 🎉", thankYouDesc: "We'll send your guide shortly.", buttonText: "Next →", submitText: "Submit →" },
  survey:   { title: "Quick Survey", description: "Your feedback matters", logoUrl: "", theme: { primaryColor: "#f59e0b", bgColor: "#ffffff", textColor: "#111827", buttonStyle: "rounded" }, questions: [], welcomeBtn: "Start Survey →", thankYouTitle: "Thanks for your feedback! 🙏", thankYouDesc: "Your responses help us improve.", buttonText: "Next →", submitText: "Submit Survey →" },
  nps:      { title: "How likely are you to recommend us?", description: "", logoUrl: "", theme: { primaryColor: "#10b981", bgColor: "#ffffff", textColor: "#111827", buttonStyle: "rounded" }, questions: [], welcomeBtn: "Start →", thankYouTitle: "Thank you! 💚", thankYouDesc: "Your feedback is valuable to us.", buttonText: "Next →", submitText: "Submit →" },
  contact:  { title: "Contact Us", description: "We'd love to hear from you", logoUrl: "", theme: { primaryColor: "#ec4899", bgColor: "#ffffff", textColor: "#111827", buttonStyle: "rounded" }, questions: [], welcomeBtn: "Start →", thankYouTitle: "Message Received! 📬", thankYouDesc: "We'll get back to you within 24 hours.", buttonText: "Next →", submitText: "Send Message →" },
};

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<string>("quiz");
  const router = useRouter();

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  useEffect(() => {
    if (!token) { router.push("/"); return; }
    fetch("/api/admin/forms", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setForms(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const createForm = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/admin/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newName, type: newType, config: DEFAULT_CONFIGS[newType] }),
    });
    const data = await res.json();
    setCreating(false);
    if (data.id) router.push(`/dashboard/forms/${data.id}/builder`);
  };

  const deleteForm = async (id: number) => {
    if (!confirm("Delete this form? This cannot be undone.")) return;
    await fetch(`/api/admin/forms/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    setForms(f => f.filter(x => x.id !== id));
  };

  const filtered = forms.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 My Forms</h1>
          <p className="text-sm text-gray-500 mt-0.5">{forms.length} form{forms.length !== 1 ? "s" : ""} created</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl transition shadow-md shadow-indigo-200 text-sm">
          + New Form
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search forms..."
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white shadow-sm w-72" />
      </div>

      {/* Forms Grid */}
      {loading ? (
        <div className="flex items-center gap-3 text-gray-400 py-12">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          Loading forms...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No forms yet</h3>
          <p className="text-gray-400 text-sm mb-6">Create your first form to start collecting leads</p>
          <button onClick={() => setShowNew(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm">
            + Create Your First Form
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(form => {
            const meta = TYPE_META[form.type] || TYPE_META.quiz;
            return (
              <div key={form.id} className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition group overflow-hidden">
                {/* Color bar */}
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.color}`}>
                      {meta.icon} {meta.label}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${form.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {form.status === "published" ? "● Live" : "○ Draft"}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1 leading-tight">{form.name}</h3>
                  <p className="text-xs text-gray-400">
                    {form.lead_count} lead{form.lead_count !== 1 ? "s" : ""} · Updated {new Date(form.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button onClick={() => router.push(`/dashboard/forms/${form.id}/builder`)}
                      className="flex-1 text-center text-xs font-semibold py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition">
                      ✏️ Edit
                    </button>
                    <button onClick={() => window.open(`/quiz/${form.id}`, "_blank")}
                      className="flex-1 text-center text-xs font-semibold py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 transition">
                      👁️ Preview
                    </button>
                    <button onClick={() => router.push(`/dashboard/forms/${form.id}/embed`)}
                      className="flex-1 text-center text-xs font-semibold py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 transition">
                      🚀 Embed
                    </button>
                    <button onClick={() => deleteForm(form.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-xs transition">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Form Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Create New Form</h2>
            <p className="text-sm text-gray-500 mb-5">Choose a type and give your form a name</p>

            {/* Type grid */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {Object.entries(TYPE_META).map(([t, m]) => (
                <button key={t} onClick={() => setNewType(t)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-sm font-medium transition ${newType === t ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  <span className="text-2xl">{m.icon}</span>
                  <span className="text-xs font-semibold">{m.label}</span>
                </button>
              ))}
            </div>

            <div className="mb-5">
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Form Name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createForm()}
                placeholder={`e.g. Skin Quiz, Contact Form...`}
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowNew(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={createForm} disabled={!newName.trim() || creating}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition disabled:opacity-50">
                {creating ? "Creating..." : "Create & Open Builder →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
