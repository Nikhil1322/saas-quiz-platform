"use client";
import { useState, useEffect } from "react";

type QType = "short_text" | "phone" | "email" | "number" | "single_choice" | "multi_choice" | "image_choice" | "rating" | "dropdown";
type Option = { id: string; text: string; imageUrl?: string; };
type Question = { id: string; label: string; description: string; key: string; type: QType; required: boolean; placeholder: string; options: Option[]; section: string; imageUrl: string; maxRating: number; };
type Theme = { primaryColor: string; bgColor: string; textColor: string; buttonStyle: "rounded" | "pill" | "sharp"; };
type Config = { title: string; description: string; logoUrl: string; theme: Theme; questions: Question[]; welcomeBtn: string; thankYouTitle: string; thankYouDesc: string; buttonText: string; submitText: string; };

const TYPES: { type: QType; icon: string; label: string; desc: string; }[] = [
    { type: "short_text", icon: "✏️", label: "Short Text", desc: "One-line answer" },
    { type: "single_choice", icon: "⭕", label: "Single Choice", desc: "Pick one option" },
    { type: "multi_choice", icon: "☑️", label: "Multi Choice", desc: "Pick many options" },
    { type: "image_choice", icon: "🖼️", label: "Image Choice", desc: "Options with images" },
    { type: "rating", icon: "⭐", label: "Star Rating", desc: "Rate from 1-5 stars" },
    { type: "phone", icon: "📱", label: "Phone Number", desc: "Mobile number input" },
    { type: "email", icon: "📧", label: "Email", desc: "Email address" },
    { type: "number", icon: "#️⃣", label: "Number", desc: "Numeric answer" },
    { type: "dropdown", icon: "🔽", label: "Dropdown", desc: "Select from list" },
];

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#14b8a6", "#000000"];

const DEFAULT_THEME: Theme = { primaryColor: "#6366f1", bgColor: "#ffffff", textColor: "#111827", buttonStyle: "rounded" };
const DEFAULT: Config = {
    title: "Skin Analysis Quiz", description: "Discover your perfect skincare routine",
    logoUrl: "", theme: DEFAULT_THEME, questions: [
        { id: "q1", key: "full_name", section: "basic", label: "What's your full name?", description: "We'll use this to personalise your results", type: "short_text", required: true, placeholder: "e.g. Priya Sharma", options: [], imageUrl: "", maxRating: 5 },
        { id: "q2", key: "skin_type", section: "skin_profile", label: "What's your skin type?", description: "", type: "single_choice", required: true, placeholder: "", options: [{ id: "o1", text: "Oily" }, { id: "o2", text: "Dry" }, { id: "o3", text: "Combination" }, { id: "o4", text: "Normal" }], imageUrl: "", maxRating: 5 },
        { id: "q3", key: "phone", section: "basic", label: "Your WhatsApp number", description: "We'll send your personalised routine here", type: "phone", required: true, placeholder: "+91 98765 43210", options: [], imageUrl: "", maxRating: 5 },
    ],
    welcomeBtn: "Start Quiz →", thankYouTitle: "You're all set! 🎉", thankYouDesc: "We'll send your personalised skincare routine to your WhatsApp shortly.",
    buttonText: "Continue →", submitText: "Get My Results ✨",
};

const newQuestion = (): Question => ({
    id: `q${Date.now()}`, key: `field_${Date.now()}`, section: "basic",
    label: "New Question", description: "", type: "short_text", required: false,
    placeholder: "", options: [], imageUrl: "", maxRating: 5,
});

const newOption = (): Option => ({ id: `o${Date.now()}`, text: "New Option", imageUrl: "" });

// ─── Phone Preview ─────────────────────────────────
function PhonePreview({ q, config }: { q: Question | undefined; config: Config }) {
    const { primaryColor, bgColor, textColor, buttonStyle } = config.theme;
    const btnRadius = buttonStyle === "pill" ? "9999px" : buttonStyle === "rounded" ? "12px" : "4px";

    return (
        <div className="relative mx-auto" style={{ width: 260 }}>
            {/* Phone shell */}
            <div className="relative bg-gray-800 rounded-[44px] p-2.5 shadow-2xl">
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-16 h-5 bg-gray-900 rounded-full z-10" />
                <div className="rounded-[36px] overflow-hidden" style={{ height: 520, backgroundColor: bgColor }}>
                    {q ? (
                        <div className="h-full flex flex-col" style={{ color: textColor }}>
                            {/* Progress bar */}
                            <div className="h-1 bg-gray-100">
                                <div className="h-1 transition-all duration-500" style={{ width: "40%", backgroundColor: primaryColor }} />
                            </div>
                            {/* Logo */}
                            {config.logoUrl && (
                                <div className="px-5 pt-4">
                                    <img src={config.logoUrl} alt="Logo" className="h-6 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
                                </div>
                            )}
                            <div className="flex-1 flex flex-col px-5 pt-5 pb-4 overflow-hidden">
                                {/* Question image */}
                                {q.imageUrl && (
                                    <div className="w-full h-24 rounded-xl overflow-hidden mb-3 bg-gray-100">
                                        <img src={q.imageUrl} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                                    </div>
                                )}
                                {/* Question text */}
                                <p className="text-sm font-bold leading-snug mb-1" style={{ color: textColor }}>
                                    {q.label || "Question text..."}{q.required && <span className="text-red-400"> *</span>}
                                </p>
                                {q.description && <p className="text-xs opacity-60 mb-3">{q.description}</p>}
                                {/* Answer area */}
                                <div className="flex-1 overflow-hidden space-y-2 mt-2">
                                    {(q.type === "short_text" || q.type === "phone" || q.type === "email" || q.type === "number") && (
                                        <div className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-400 bg-gray-50">{q.placeholder || "Type your answer..."}</div>
                                    )}
                                    {(q.type === "single_choice" || q.type === "multi_choice") && (q.options || []).slice(0, 4).map(opt => (
                                        <div key={opt.id} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                                            <div className={`w-3.5 h-3.5 border-2 border-gray-300 shrink-0 ${q.type === "single_choice" ? "rounded-full" : "rounded"}`} />
                                            <span className="text-xs text-gray-700">{opt.text}</span>
                                        </div>
                                    ))}
                                    {q.type === "image_choice" && (
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {(q.options || []).slice(0, 4).map(opt => (
                                                <div key={opt.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                                    {opt.imageUrl ? (
                                                        <img src={opt.imageUrl} alt="" className="w-full h-14 object-cover" onError={e => { e.currentTarget.style.display = "none"; }} />
                                                    ) : (
                                                        <div className="w-full h-14 bg-gray-100 flex items-center justify-center text-gray-300 text-xl">🖼️</div>
                                                    )}
                                                    <p className="text-xs text-center py-1 px-1 truncate">{opt.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {q.type === "rating" && (
                                        <div className="flex gap-1 justify-center mt-2">
                                            {Array.from({ length: q.maxRating || 5 }).map((_, i) => (
                                                <span key={i} className="text-lg">⭐</span>
                                            ))}
                                        </div>
                                    )}
                                    {q.type === "dropdown" && (
                                        <div className="border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between">
                                            <span className="text-xs text-gray-400">Select an option...</span>
                                            <span className="text-gray-400">▾</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Button */}
                            <div className="px-5 pb-5">
                                <div className="text-white text-xs text-center py-2.5 font-semibold shadow-lg"
                                    style={{ backgroundColor: primaryColor, borderRadius: btnRadius }}>
                                    {config.buttonText}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Welcome screen
                        <div className="h-full flex flex-col items-center justify-center px-5 text-center">
                            {config.logoUrl && <img src={config.logoUrl} alt="" className="h-8 mb-4 object-contain" />}
                            <h3 className="text-base font-bold mb-2" style={{ color: textColor }}>{config.title}</h3>
                            <p className="text-xs opacity-60 mb-6">{config.description}</p>
                            <div className="text-white text-xs py-2.5 px-6 font-semibold"
                                style={{ backgroundColor: primaryColor, borderRadius: btnRadius }}>
                                {config.welcomeBtn}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-3 font-medium">Live Preview</p>
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────
export default function QuizBuilderPage() {
    const [config, setConfig] = useState<Config>(DEFAULT);
    const [selectedId, setSelectedId] = useState<string | null>("q1");
    const [rightTab, setRightTab] = useState<"preview" | "style">("preview");
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewStep, setPreviewStep] = useState(-1); // -1 = welcome
    const [token, setToken] = useState("");

    useEffect(() => {
        const t = localStorage.getItem("merchant_token") || "";
        setToken(t);
        fetch("/api/admin/quiz-config", { headers: { Authorization: `Bearer ${t}` } })
            .then(r => r.json()).then(d => { if (d?.questions?.length) setConfig(d); }).catch(() => { });
    }, []);

    const save = async (thenRedirect?: boolean) => {
        setSaving(true);
        await fetch("/api/admin/quiz-config", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(config),
        });
        setSaving(false); setSaveMsg("✓ Saved!"); setTimeout(() => setSaveMsg(""), 2000);
        if (thenRedirect) window.location.href = "/dashboard/embed";
    };

    const selQ = config.questions.find(q => q.id === selectedId) || null;
    const upd = (id: string, patch: Partial<Question>) =>
        setConfig(c => ({ ...c, questions: c.questions.map(q => q.id === id ? { ...q, ...patch } : q) }));
    const updTheme = (patch: Partial<Theme>) => setConfig(c => ({ ...c, theme: { ...c.theme, ...patch } }));

    const addQ = () => { const q = newQuestion(); setConfig(c => ({ ...c, questions: [...c.questions, q] })); setSelectedId(q.id); };
    const delQ = (id: string) => { const rest = config.questions.filter(q => q.id !== id); setConfig(c => ({ ...c, questions: rest })); setSelectedId(rest[0]?.id || null); };
    const move = (idx: number, d: -1 | 1) => {
        const qs = [...config.questions]; const ni = idx + d;
        if (ni < 0 || ni >= qs.length) return;
        [qs[idx], qs[ni]] = [qs[ni], qs[idx]]; setConfig(c => ({ ...c, questions: qs }));
    };

    const addOpt = (qId: string) => upd(qId, { options: [...(selQ?.options || []), newOption()] });
    const updOpt = (qId: string, oid: string, patch: Partial<Option>) => upd(qId, { options: selQ?.options?.map(o => o.id === oid ? { ...o, ...patch } : o) });
    const delOpt = (qId: string, oid: string) => upd(qId, { options: selQ?.options?.filter(o => o.id !== oid) });

    const hasOptions = (t: QType) => ["single_choice", "multi_choice", "image_choice", "dropdown"].includes(t);

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
            {/* ── TOP BAR ── */}
            <div className="bg-white border-b px-6 py-3 flex items-center gap-4 shrink-0 shadow-sm">
                <div className="flex-1">
                    <input value={config.title} onChange={e => setConfig(c => ({ ...c, title: e.target.value }))}
                        className="text-lg font-bold text-gray-900 bg-transparent border-0 focus:outline-none focus:bg-gray-50 rounded-lg px-2 py-1 w-full max-w-sm"
                        placeholder="Your Quiz Title..." />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => { setPreviewStep(-1); setShowPreviewModal(true); }}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition">
                        👁️ Preview
                    </button>
                    <button onClick={() => save()} disabled={saving}
                        className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-xl transition disabled:opacity-60">
                        {saveMsg || (saving ? "Saving..." : "💾 Save")}
                    </button>
                    <button onClick={() => save(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition shadow-md shadow-indigo-200">
                        🚀 Publish & Embed
                    </button>
                </div>
            </div>

            {/* ── MAIN 3-PANEL ── */}
            <div className="flex flex-1 overflow-hidden">

                {/* LEFT: Question List */}
                <div className="w-64 bg-white border-r flex flex-col shrink-0">
                    <div className="p-4 border-b">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Questions ({config.questions.length})</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                        {/* Welcome card */}
                        <div onClick={() => setSelectedId(null)}
                            className={`p-3 rounded-xl border cursor-pointer transition text-xs ${!selectedId ? "border-indigo-300 bg-indigo-50" : "border-gray-100 hover:bg-gray-50"}`}>
                            <span className="font-semibold text-gray-600">👋 Welcome Screen</span>
                        </div>
                        {config.questions.map((q, idx) => (
                            <div key={q.id} onClick={() => setSelectedId(q.id)}
                                className={`p-3 rounded-xl border cursor-pointer transition group ${selectedId === q.id ? "border-indigo-300 bg-indigo-50 shadow-sm" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"}`}>
                                <div className="flex items-start justify-between gap-1">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-xs text-gray-400 font-mono shrink-0">{idx + 1}</span>
                                            <span className="text-xs font-semibold text-gray-700 truncate">{q.label || "Untitled"}</span>
                                            {q.required && <span className="text-red-400 shrink-0">*</span>}
                                        </div>
                                        <span className="text-xs text-gray-400">{TYPES.find(t => t.type === q.type)?.icon} {TYPES.find(t => t.type === q.type)?.label}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
                                        <button onClick={e => { e.stopPropagation(); move(idx, -1); }} className="text-gray-300 hover:text-gray-600 leading-none text-xs">↑</button>
                                        <button onClick={e => { e.stopPropagation(); move(idx, 1); }} className="text-gray-300 hover:text-gray-600 leading-none text-xs">↓</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 border-t">
                        <button onClick={addQ}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition shadow-md shadow-indigo-200">
                            + Add Question
                        </button>
                    </div>
                </div>

                {/* CENTER: Editor */}
                <div className="flex-1 overflow-y-auto p-6">
                    {!selectedId ? (
                        /* Welcome Screen Editor */
                        <div className="max-w-xl space-y-4">
                            <div className="bg-white rounded-2xl border shadow-sm p-6">
                                <h2 className="font-bold text-gray-900 mb-1">👋 Welcome Screen</h2>
                                <p className="text-sm text-gray-500 mb-5">The first thing users see before starting the quiz</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 block mb-1.5">Quiz Title</label>
                                        <input value={config.title} onChange={e => setConfig(c => ({ ...c, title: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 block mb-1.5">Subtitle / Description</label>
                                        <textarea value={config.description} onChange={e => setConfig(c => ({ ...c, description: e.target.value }))} rows={2}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 block mb-1.5">Logo Image URL <span className="font-normal text-gray-400">(optional)</span></label>
                                        <input value={config.logoUrl} onChange={e => setConfig(c => ({ ...c, logoUrl: e.target.value }))}
                                            placeholder="https://your-site.com/logo.png"
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                        {config.logoUrl && <img src={config.logoUrl} alt="" className="mt-2 h-10 object-contain rounded" onError={e => (e.currentTarget.style.display = "none")} />}
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 block mb-1.5">Start Button Text</label>
                                        <input value={config.welcomeBtn} onChange={e => setConfig(c => ({ ...c, welcomeBtn: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl border shadow-sm p-6">
                                <h2 className="font-bold text-gray-900 mb-1">🎉 Thank You Screen</h2>
                                <p className="text-sm text-gray-500 mb-5">Shown after the user submits the quiz</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 block mb-1.5">Title</label>
                                        <input value={config.thankYouTitle} onChange={e => setConfig(c => ({ ...c, thankYouTitle: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 block mb-1.5">Message</label>
                                        <textarea value={config.thankYouDesc} onChange={e => setConfig(c => ({ ...c, thankYouDesc: e.target.value }))} rows={3}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : selQ ? (
                        /* Question Editor */
                        <div className="max-w-2xl space-y-4">
                            {/* Type Picker */}
                            <div className="bg-white rounded-2xl border shadow-sm p-6">
                                <h3 className="text-sm font-bold text-gray-700 mb-3">📌 Answer Type — <span className="font-normal text-gray-400">How should users answer this question?</span></h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {TYPES.map(t => (
                                        <button key={t.type} onClick={() => upd(selQ.id, { type: t.type })}
                                            className={`flex items-start gap-2 p-3 rounded-xl border text-left transition ${selQ.type === t.type ? "border-indigo-400 bg-indigo-50 shadow-sm" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                                            <span className="text-xl shrink-0">{t.icon}</span>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-800">{t.label}</p>
                                                <p className="text-xs text-gray-400 leading-tight">{t.desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Question Content */}
                            <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-5">
                                <h3 className="text-sm font-bold text-gray-700">✏️ Edit Question</h3>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-1">Question Text <span className="text-red-400">*</span></label>
                                    <input value={selQ.label} onChange={e => upd(selQ.id, { label: e.target.value })}
                                        placeholder="Ask your question here..."
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium" />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-1">Helper Text <span className="font-normal text-gray-400">(optional)</span></label>
                                    <input value={selQ.description} onChange={e => upd(selQ.id, { description: e.target.value })}
                                        placeholder="Add a short hint or description..."
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-600" />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-1">
                                        Question Image <span className="font-normal text-gray-400">(optional — paste image URL)</span>
                                    </label>
                                    <input value={selQ.imageUrl} onChange={e => upd(selQ.id, { imageUrl: e.target.value })}
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                    {selQ.imageUrl && (
                                        <div className="mt-2 relative w-full h-36 bg-gray-100 rounded-xl overflow-hidden">
                                            <img src={selQ.imageUrl} alt="" className="w-full h-full object-cover"
                                                onError={e => { e.currentTarget.parentElement!.innerHTML = '<p class="text-xs text-red-400 p-3">⚠️ Image could not load — check the URL</p>'; }} />
                                            <button onClick={() => upd(selQ.id, { imageUrl: "" })}
                                                className="absolute top-2 right-2 bg-white rounded-full w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-500 shadow text-xs">✕</button>
                                        </div>
                                    )}
                                </div>

                                {(selQ.type === "short_text" || selQ.type === "phone" || selQ.type === "email" || selQ.type === "number") && (
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 block mb-1">Placeholder Text</label>
                                        <input value={selQ.placeholder} onChange={e => upd(selQ.id, { placeholder: e.target.value })}
                                            placeholder="Eg: Enter your name..."
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                    </div>
                                )}

                                {selQ.type === "rating" && (
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 block mb-2">Max Stars</label>
                                        <div className="flex gap-2">
                                            {[3, 4, 5, 6, 7, 10].map(n => (
                                                <button key={n} onClick={() => upd(selQ.id, { maxRating: n })}
                                                    className={`w-10 h-10 rounded-xl border text-sm font-bold transition ${selQ.maxRating === n ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600 hover:border-indigo-400"}`}>
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {hasOptions(selQ.type) && (
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 block mb-3">
                                            Answer Options
                                            {selQ.type === "image_choice" && <span className="font-normal text-gray-400 ml-1">(each option can have an image)</span>}
                                        </label>
                                        <div className="space-y-2">
                                            {(selQ.options || []).map((opt, i) => (
                                                <div key={opt.id} className="border border-gray-200 rounded-xl p-3 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-4 h-4 border-2 border-gray-300 shrink-0 ${selQ.type === "single_choice" ? "rounded-full" : "rounded"}`} />
                                                        <input value={opt.text} onChange={e => updOpt(selQ.id, opt.id, { text: e.target.value })}
                                                            placeholder={`Option ${i + 1}`}
                                                            className="flex-1 text-sm focus:outline-none text-gray-800" />
                                                        <button onClick={() => delOpt(selQ.id, opt.id)} className="text-red-400 hover:text-red-600 text-xs w-5">✕</button>
                                                    </div>
                                                    {selQ.type === "image_choice" && (
                                                        <div>
                                                            <input value={opt.imageUrl || ""} onChange={e => updOpt(selQ.id, opt.id, { imageUrl: e.target.value })}
                                                                placeholder="https://example.com/option-image.jpg"
                                                                className="w-full text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                                                            {opt.imageUrl && (
                                                                <img src={opt.imageUrl} alt="" className="mt-1.5 h-16 w-full object-cover rounded-lg"
                                                                    onError={e => (e.currentTarget.style.display = "none")} />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            <button onClick={() => addOpt(selQ.id)}
                                                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:text-indigo-600 text-gray-500 text-sm font-medium py-2.5 rounded-xl transition">
                                                + Add Option
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t">
                                    <div className="flex items-center gap-3">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={selQ.required} onChange={e => upd(selQ.id, { required: e.target.checked })} className="sr-only peer" />
                                            <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 transition after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition peer-checked:after:translate-x-4" />
                                        </label>
                                        <span className="text-sm font-medium text-gray-700">Required field {selQ.required && <span className="text-red-400">*</span>}</span>
                                    </div>
                                    <button onClick={() => delQ(selQ.id)}
                                        className="text-red-400 hover:text-red-600 text-sm font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition">
                                        🗑️ Delete Question
                                    </button>
                                </div>
                            </div>

                            {/* Navigation buttons config */}
                            <div className="bg-white rounded-2xl border shadow-sm p-6">
                                <h3 className="text-sm font-bold text-gray-700 mb-4">🔘 Button Labels</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Next / Continue button</label>
                                        <input value={config.buttonText} onChange={e => setConfig(c => ({ ...c, buttonText: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Submit button (last question)</label>
                                        <input value={config.submitText} onChange={e => setConfig(c => ({ ...c, submitText: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* RIGHT: Preview + Style */}
                <div className="w-80 border-l bg-white flex flex-col shrink-0">
                    <div className="flex border-b">
                        {(["preview", "style"] as const).map(t => (
                            <button key={t} onClick={() => setRightTab(t)}
                                className={`flex-1 py-3 text-sm font-semibold capitalize transition ${rightTab === t ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50" : "text-gray-500 hover:text-gray-700"}`}>
                                {t === "preview" ? "📱 Preview" : "🎨 Style"}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-5">
                        {rightTab === "preview" ? (
                            <PhonePreview q={selQ || undefined} config={config} />
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Brand Color</h3>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {COLORS.map(c => (
                                            <button key={c} onClick={() => updTheme({ primaryColor: c })}
                                                className={`w-8 h-8 rounded-xl border-2 transition hover:scale-110 ${config.theme.primaryColor === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                                                style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-2">
                                        <input type="color" value={config.theme.primaryColor} onChange={e => updTheme({ primaryColor: e.target.value })}
                                            className="w-8 h-8 rounded-lg cursor-pointer border-0" />
                                        <span className="text-sm font-mono text-gray-600">{config.theme.primaryColor}</span>
                                        <span className="text-xs text-gray-400 ml-auto">Custom</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Background Color</h3>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {["#ffffff", "#f8f9fa", "#f0f4ff", "#fff7ed", "#f0fdf4", "#fdf4ff", "#1e1b4b", "#0f172a"].map(c => (
                                            <button key={c} onClick={() => updTheme({ bgColor: c })}
                                                className={`w-8 h-8 rounded-xl border-2 transition hover:scale-110 ${config.theme.bgColor === c ? "border-indigo-500 scale-110" : "border-gray-200"}`}
                                                style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-2">
                                        <input type="color" value={config.theme.bgColor} onChange={e => updTheme({ bgColor: e.target.value })}
                                            className="w-8 h-8 rounded-lg cursor-pointer border-0" />
                                        <span className="text-sm font-mono text-gray-600">{config.theme.bgColor}</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Button Shape</h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {([{ v: "rounded", label: "Rounded", r: "10px" }, { v: "pill", label: "Pill", r: "9999px" }, { v: "sharp", label: "Sharp", r: "4px" }] as const).map(s => (
                                            <button key={s.v} onClick={() => updTheme({ buttonStyle: s.v })}
                                                className={`py-2 text-xs font-semibold border transition ${config.theme.buttonStyle === s.v ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                                                style={{ borderRadius: s.r }}>
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quiz Branding</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-medium text-gray-600 block mb-1">Logo Image URL</label>
                                            <input value={config.logoUrl} onChange={e => setConfig(c => ({ ...c, logoUrl: e.target.value }))}
                                                placeholder="https://..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── FULL PREVIEW MODAL ── */}
            {showPreviewModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <div>
                                <h2 className="font-bold text-gray-900">Full Quiz Preview</h2>
                                <p className="text-xs text-gray-500">This is exactly how users will see your quiz</p>
                            </div>
                            <button onClick={() => setShowPreviewModal(false)} className="text-gray-400 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">✕</button>
                        </div>
                        <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 p-8">
                            <div className="flex gap-6 items-start">
                                {/* Step selector */}
                                <div className="bg-white rounded-2xl border shadow-sm p-4 w-48 space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Steps</p>
                                    <div onClick={() => setPreviewStep(-1)}
                                        className={`text-xs px-3 py-2 rounded-lg cursor-pointer transition ${previewStep === -1 ? "bg-indigo-600 text-white" : "hover:bg-gray-50 text-gray-700"}`}>
                                        👋 Welcome Screen
                                    </div>
                                    {config.questions.map((q, i) => (
                                        <div key={q.id} onClick={() => setPreviewStep(i)}
                                            className={`text-xs px-3 py-2 rounded-lg cursor-pointer transition truncate ${previewStep === i ? "bg-indigo-600 text-white" : "hover:bg-gray-50 text-gray-700"}`}>
                                            {i + 1}. {q.label}
                                        </div>
                                    ))}
                                    <div onClick={() => setPreviewStep(config.questions.length)}
                                        className={`text-xs px-3 py-2 rounded-lg cursor-pointer transition ${previewStep === config.questions.length ? "bg-indigo-600 text-white" : "hover:bg-gray-50 text-gray-700"}`}>
                                        🎉 Thank You
                                    </div>
                                </div>
                                {/* Phone */}
                                <PhonePreview
                                    q={previewStep >= 0 && previewStep < config.questions.length ? config.questions[previewStep] : undefined}
                                    config={config}
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
                            <button onClick={() => setPreviewStep(p => Math.max(-1, p - 1))} disabled={previewStep === -1}
                                className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40">← Previous</button>
                            <span className="text-xs text-gray-400">
                                {previewStep === -1 ? "Welcome" : previewStep === config.questions.length ? "Thank You" : `Question ${previewStep + 1} of ${config.questions.length}`}
                            </span>
                            <button onClick={() => setPreviewStep(p => Math.min(config.questions.length, p + 1))} disabled={previewStep === config.questions.length}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-40">Next →</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
