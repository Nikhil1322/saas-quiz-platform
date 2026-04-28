"use client";
// Uses relative /api/* paths — works on localhost AND ngrok/any domain
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

type QType = "short_text"|"phone"|"email"|"number"|"single_choice"|"multi_choice"|"image_choice"|"image_upload"|"rating"|"dropdown"|"nps"|"appointment";
type Option = { id: string; text: string; imageUrl?: string };
type LogicJump = { condition: string; value: string; goTo: string };
type Q = { id: string; label: string; description: string; key: string; type: QType; required: boolean; placeholder: string; options: Option[]; section: string; imageUrl: string; maxRating: number; logicJumps?: LogicJump[]; duration?: number };
type Theme = { primaryColor: string; bgColor: string; textColor: string; buttonStyle: string };
type Cfg = { title: string; description: string; logoUrl: string; theme: Theme; questions: Q[]; welcomeBtn: string; thankYouTitle: string; thankYouDesc: string; buttonText: string; submitText: string };

function BookingCalendar({ merchantId, duration, onSelect, primaryColor }: { merchantId: number; duration: number; onSelect: (val: string) => void; primaryColor: string }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [availRules, setAvailRules] = useState<any[]>([]);

  useEffect(() => {
    // Fetch base availability rules once to highlight days
    fetch(`/api/admin/bookings/public/availability/rules/${merchantId}`)
      .then(r => r.json())
      .then(data => setAvailRules(data))
      .catch(() => {});
  }, [merchantId]);

  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    fetch(`/api/admin/bookings/public/availability/${merchantId}?date=${selectedDate}`)
      .then(r => r.json())
      .then(data => {
        const { availability, bookings } = data;
        const daySlots: string[] = [];
        availability.forEach((avail: any) => {
          let current = avail.start_time;
          while (current < avail.end_time) {
            const isBooked = bookings.some((b: any) => b.booking_time === current);
            if (!isBooked) daySlots.push(current);
            const [h, m] = current.split(':').map(Number);
            const next = new Date(0, 0, 0, h, m + (duration || 30));
            current = next.toTimeString().split(' ')[0].substring(0, 5);
          }
        });
        setSlots(daySlots);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedDate, merchantId, duration]);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const isDayAvailable = (day: number) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (date < new Date(new Date().setHours(0,0,0,0))) return false;
    const dow = date.getDay();
    return availRules.some(r => r.day_of_week === dow);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Calendar View */}
            <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-gray-900">{monthName}</h3>
                    <div className="flex gap-2">
                        <button 
                            disabled={viewDate.getMonth() === new Date().getMonth() && viewDate.getFullYear() === new Date().getFullYear()}
                            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} 
                            className="w-10 h-10 rounded-full border hover:bg-gray-50 flex items-center justify-center transition disabled:opacity-20"
                        >←</button>
                        <button 
                            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} 
                            className="w-10 h-10 rounded-full border hover:bg-gray-50 flex items-center justify-center transition"
                        >→</button>
                    </div>
                </div>
                
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-[10px] font-black text-gray-400 uppercase text-center tracking-widest">{d}</div>
                    ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const available = isDayAvailable(day);
                        const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isSelected = selectedDate === dateStr;
                        
                        return (
                            <button 
                                key={day}
                                disabled={!available}
                                onClick={() => setSelectedDate(dateStr)}
                                className={`
                                    relative h-12 w-full rounded-2xl font-bold text-sm transition-all flex items-center justify-center
                                    ${!available ? 'bg-red-50 text-red-300 cursor-not-allowed border border-red-100' : 'bg-emerald-50 text-emerald-700 hover:scale-110 active:scale-95 border border-emerald-100'}
                                    ${isSelected ? 'bg-black text-white shadow-xl shadow-gray-300 !border-black' : ''}
                                `}
                            >
                                {day}
                                {available && !isSelected && (
                                    <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                )}
                            </button>
                        );
                    })}
                </div>
                
                <div className="mt-6 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-emerald-500" /> Available</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-red-400" /> Booked / Closed</div>
                </div>
            </div>

            {/* Slots View */}
            <div className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l lg:pl-8 pt-6 lg:pt-0">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 block">Select Time Slot</label>
                
                {!selectedDate ? (
                    <div className="h-full flex flex-col items-center justify-center py-12 text-center opacity-40">
                        <span className="text-4xl mb-3">📅</span>
                        <p className="text-xs font-bold leading-relaxed">Choose a green date<br/>to book your slot</p>
                    </div>
                ) : loading ? (
                    <div className="py-12 text-center animate-pulse font-bold text-gray-400">Verifying slots...</div>
                ) : (
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                        <style>{`
                            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                            .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
                            .custom-scrollbar::-webkit-scrollbar-thumb { background: #000; border-radius: 10px; }
                        `}</style>
                        {slots.map(s => (
                            <button 
                                key={s}
                                onClick={() => { onSelect(`${selectedDate} ${s}`); }}
                                className="w-full py-4 rounded-2xl border-2 border-gray-100 font-black text-sm text-gray-700 hover:border-black transition-all hover:bg-gray-50 active:scale-95 flex items-center justify-center gap-2 group"
                            >
                                <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition" />
                                {s}
                            </button>
                        ))}
                        {slots.length === 0 && (
                            <div className="text-center py-8">
                                <span className="text-2xl mb-2 block">🚫</span>
                                <p className="text-red-400 font-bold text-xs">All slots booked for this day</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

export default function QuizRenderer() {
  const { formId } = useParams() as { formId: string };
  const [form, setForm] = useState<{ id: number; merchant_id: number; config: Cfg } | null>(null);
  const [step, setStep] = useState<"welcome"|"q"|"done">("welcome");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [cur, setCur] = useState<any>(null);
  const [err, setErr] = useState("");
  const [anim, setAnim] = useState(false);
  const [dir, setDir] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetch(`/api/quiz/form/${formId}`)
      .then(r => r.json()).then(d => { if (d.msg) setLoadErr(d.msg); else setForm(d); setLoading(false); })
      .catch(() => { setLoadErr("Could not load form"); setLoading(false); });
  }, [formId]);

  const cfg = form?.config;
  const qs = cfg?.questions || [];
  const q = qs[idx];
  const theme = cfg?.theme || { primaryColor: "#6366f1", bgColor: "#ffffff", textColor: "#111827", buttonStyle: "rounded" };
  const br = theme.buttonStyle === "pill" ? "9999px" : theme.buttonStyle === "sharp" ? "4px" : "12px";
  const progress = qs.length ? ((idx) / qs.length) * 100 : 0;

  const animate = (newDir: number, fn: () => void) => {
    setDir(newDir); setAnim(true);
    setTimeout(() => { fn(); setAnim(false); }, 300);
  };

  const nextIdx = useCallback((q: Q, ans: any) => {
    for (const j of (q.logicJumps || [])) {
      const vals = Array.isArray(ans) ? ans : [String(ans ?? "")];
      if (j.condition === "is" && vals.includes(j.value)) {
        const t = qs.findIndex(x => x.id === j.goTo);
        if (t !== -1) return t;
      }
    }
    return idx + 1;
  }, [idx, qs]);

  const goNext = useCallback(async () => {
    if (q?.type === "image_upload" && uploadFile) {
      setUploading(true);
      const fd = new FormData();
      fd.append("image", uploadFile);
      try {
        const res = await fetch("/api/quiz/upload", { method: "POST", body: fd });
        const data = await res.json();
        const uploadedUrl = data.url || "";
        setUploading(false);
        if (!uploadedUrl) { setErr("Upload failed, please try again"); return; }
        const newAns = { ...answers, [q.key]: uploadedUrl };
        setAnswers(newAns);
        setUploadFile(null);
        const ni = nextIdx(q, uploadedUrl);
        if (ni >= qs.length) {
          setSubmitting(true);
          const name = newAns.full_name || newAns.name || "";
          const phone = newAns.phone || newAns.whatsapp || "";
          try { 
            const bookingField = qs.find(x => x.type === 'appointment');
            if (bookingField && newAns[bookingField.key]) {
              const [d, t] = newAns[bookingField.key].split(' ');
              await fetch('/api/admin/bookings/public/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  merchant_id: form?.merchant_id,
                  name, email: newAns.email || '', phone,
                  date: d, time: t, duration: bookingField.duration || 30
                })
              });
            }
            await fetch(`/api/quiz`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone, answers: newAns, formId: form?.id, result: "completed" }) }); 
          } catch {}
          setSubmitting(false);
          animate(1, () => setStep("done"));
        } else {
          animate(1, () => { setIdx(ni); setCur(newAns[qs[ni]?.key] ?? null); });
        }
        return;
      } catch { setUploading(false); setErr("Upload failed"); return; }
    }
    if (q?.required && !cur && cur !== 0) { setErr("This field is required"); return; }
    setErr("");
    const newAns = { ...answers, [q.key]: cur };
    setAnswers(newAns);
    const ni = nextIdx(q, cur);
    if (ni >= qs.length) {
      setSubmitting(true);
      const name = newAns.full_name || newAns.name || "";
      const phone = newAns.phone || newAns.whatsapp || "";
      try { 
        const bookingField = qs.find(x => x.type === 'appointment');
        if (bookingField && newAns[bookingField.key]) {
            const [d, t] = newAns[bookingField.key].split(' ');
            await fetch('/api/admin/bookings/public/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    merchant_id: form?.merchant_id,
                    name, email: newAns.email || '', phone,
                    date: d, time: t, duration: bookingField.duration || 30
                })
            });
        }
        await fetch(`/api/quiz`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone, answers: newAns, formId: form?.id, result: "completed" }) }); 
      } catch {}
      setSubmitting(false);
      animate(1, () => setStep("done"));
    } else {
      animate(1, () => { setIdx(ni); setCur(newAns[qs[ni]?.key] ?? null); });
    }
  }, [q, cur, answers, nextIdx, qs, form?.id, form?.merchant_id, uploadFile]);

  useEffect(() => {
    setUploadFile(null);
    setUploadPreview(cur && typeof cur === "string" && cur.startsWith("http") ? cur : "");
  }, [idx]);

  const handleImageFile = (file: File) => {
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
    setCur(null);
    setErr("");
  };

  const goBack = () => {
    if (idx === 0) { animate(-1, () => setStep("welcome")); return; }
    setAnswers(a => ({ ...a, [q.key]: cur }));
    animate(-1, () => { setIdx(i => i - 1); setCur(answers[qs[idx - 1]?.key] ?? null); });
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Enter" && step === "q" && q?.type !== "multi_choice" && q?.type !== "appointment") goNext(); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [step, goNext, q]);

  const toggle = (val: string) => {
    const arr: string[] = Array.isArray(cur) ? [...cur] : [];
    setCur(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const slideStyle: React.CSSProperties = {
    transition: "all 0.3s ease",
    opacity: anim ? 0 : 1,
    transform: anim ? `translateY(${dir > 0 ? 40 : -40}px)` : "translateY(0)",
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 44, height: 44, border: "3px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#6b7280", fontSize: 14 }}>Loading...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (loadErr) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <h2 style={{ color: "#111827", marginBottom: 8, fontSize: 20, fontWeight: 700 }}>Form Not Available</h2>
        <p style={{ color: "#6b7280", fontSize: 14 }}>{loadErr}</p>
      </div>
    </div>
  );

  const s = { minHeight: "100vh", display: "flex" as const, flexDirection: "column" as const, background: theme.bgColor, color: theme.textColor, fontFamily: "'Inter', system-ui, sans-serif" };
  const btnBase = { display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: theme.primaryColor, color: "#fff", fontWeight: 700, fontSize: 16, border: "none", cursor: "pointer", borderRadius: br, transition: "opacity 0.2s", width: "100%", justifyContent: "center" as const };
  const inputStyle = { width: "100%", padding: "14px 16px", fontSize: 18, border: `2px solid ${theme.primaryColor}30`, borderBottom: `3px solid ${theme.primaryColor}`, background: "transparent", color: theme.textColor, outline: "none", borderRadius: 8 };
  const optBase = { padding: "14px 18px", borderRadius: 12, border: "2px solid", cursor: "pointer", fontSize: 15, fontWeight: 600, transition: "all 0.15s", textAlign: "left" as const, width: "100%", display: "flex", alignItems: "center", gap: 12 };

  if (step === "welcome") return (
    <div style={s}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ ...slideStyle, maxWidth: 560, width: "100%", textAlign: "center" }}>
          {cfg?.logoUrl && <img src={cfg.logoUrl} alt="" style={{ height: 48, objectFit: "contain", marginBottom: 24 }} />}
          <h1 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>{cfg?.title}</h1>
          {cfg?.description && <p style={{ fontSize: 18, opacity: 0.7, marginBottom: 40 }}>{cfg.description}</p>}
          <button style={{ ...btnBase, fontSize: 18, maxWidth: 320, margin: "0 auto" }} onClick={() => animate(1, () => { setIdx(0); setCur(null); setStep("q"); })}>
            {cfg?.welcomeBtn || "Start →"}
          </button>
          {qs.length > 0 && <p style={{ marginTop: 16, fontSize: 13, opacity: 0.5 }}>{qs.length} question{qs.length !== 1 ? "s" : ""} · ~2 min</p>}
        </div>
      </div>
    </div>
  );

  if (step === "done") return (
    <div style={s}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ ...slideStyle, maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>{cfg?.thankYouTitle}</h1>
          <p style={{ fontSize: 18, opacity: 0.7 }}>{cfg?.thankYouDesc}</p>
        </div>
      </div>
    </div>
  );

  const isLast = idx === qs.length - 1;
  const btnLabel = isLast ? (cfg?.submitText || "Submit ✨") : (cfg?.buttonText || "Continue →");

  return (
    <div style={s}>
      <div style={{ height: 4, background: `${theme.primaryColor}20`, flexShrink: 0 }}>
        <div style={{ height: "100%", background: theme.primaryColor, width: `${progress}%`, transition: "width 0.4s ease" }} />
      </div>

      <div style={{ padding: "16px 24px", flexShrink: 0 }}>
        {cfg?.logoUrl && <img src={cfg.logoUrl} alt="" style={{ height: 32, objectFit: "contain" }} />}
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ ...slideStyle, maxWidth: 640, width: "100%" }}>
          {q?.imageUrl && (
            <div style={{ marginBottom: 24, borderRadius: 16, overflow: "hidden", maxHeight: 220 }}>
              <img src={q.imageUrl} alt="" style={{ width: "100%", objectFit: "cover" }} />
            </div>
          )}
          <p style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
            {q?.label}{q?.required && <span style={{ color: "#ef4444" }}> *</span>}
          </p>
          {q?.description && <p style={{ fontSize: 15, opacity: 0.6, marginBottom: 24 }}>{q.description}</p>}

          <div style={{ marginBottom: 32 }}>
            {(q?.type === "short_text" || q?.type === "email" || q?.type === "number") && (
              <input style={inputStyle} type={q.type === "email" ? "email" : q.type === "number" ? "number" : "text"}
                value={cur || ""} onChange={e => { setCur(e.target.value); setErr(""); }}
                placeholder={q.placeholder || "Type your answer..."} autoFocus />
            )}
            {q?.type === "phone" && (
              <input style={inputStyle} type="tel" value={cur || ""} onChange={e => { setCur(e.target.value); setErr(""); }}
                placeholder={q.placeholder || "+91 98765 43210"} autoFocus />
            )}
            {q?.type === "single_choice" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(q.options || []).map(o => {
                  const sel = cur === o.text;
                  return (
                    <button key={o.id} style={{ ...optBase, borderColor: sel ? theme.primaryColor : `${theme.textColor}20`, background: sel ? `${theme.primaryColor}15` : "transparent", color: theme.textColor }}
                      onClick={() => { setCur(o.text); setErr(""); setTimeout(goNext, 300); }}>
                      <span style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${sel ? theme.primaryColor : theme.textColor + "40"}`, background: sel ? theme.primaryColor : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {sel && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", display: "block" }} />}
                      </span>
                      {o.text}
                    </button>
                  );
                })}
              </div>
            )}
            {q?.type === "multi_choice" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(q.options || []).map(o => {
                  const arr = Array.isArray(cur) ? cur : [];
                  const sel = arr.includes(o.text);
                  return (
                    <button key={o.id} style={{ ...optBase, borderColor: sel ? theme.primaryColor : `${theme.textColor}20`, background: sel ? `${theme.primaryColor}15` : "transparent", color: theme.textColor }}
                      onClick={() => toggle(o.text)}>
                      <span style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${sel ? theme.primaryColor : theme.textColor + "40"}`, background: sel ? theme.primaryColor : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {sel && <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>✓</span>}
                      </span>
                      {o.text}
                    </button>
                  );
                })}
              </div>
            )}
            {q?.type === "image_choice" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12 }}>
                {(q.options || []).map(o => {
                  const sel = cur === o.text;
                  return (
                    <button key={o.id} onClick={() => { setCur(o.text); setErr(""); setTimeout(goNext, 300); }}
                      style={{ border: `2px solid ${sel ? theme.primaryColor : theme.textColor + "20"}`, borderRadius: 12, overflow: "hidden", cursor: "pointer", background: "transparent", padding: 0, transition: "all 0.15s", transform: sel ? "scale(1.03)" : "scale(1)" }}>
                      {o.imageUrl ? <img src={o.imageUrl} alt={o.text} style={{ width: "100%", height: 100, objectFit: "cover" }} /> : <div style={{ height: 100, background: `${theme.primaryColor}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🖼️</div>}
                      <p style={{ padding: "8px", fontSize: 13, fontWeight: 600, color: theme.textColor }}>{o.text}</p>
                    </button>
                  );
                })}
              </div>
            )}
            {q?.type === "rating" && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Array.from({ length: q.maxRating || 5 }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => { setCur(n); setErr(""); }}
                    style={{ fontSize: 36, cursor: "pointer", background: "transparent", border: "none", padding: 4, transition: "transform 0.15s", transform: cur >= n ? "scale(1.2)" : "scale(1)", filter: cur >= n ? "saturate(1)" : "saturate(0) opacity(0.4)" }}>
                    ⭐
                  </button>
                ))}
              </div>
            )}
            {q?.type === "dropdown" && (
              <select value={cur || ""} onChange={e => { setCur(e.target.value); setErr(""); }}
                style={{ ...inputStyle, appearance: "none", background: `${theme.primaryColor}05`, paddingRight: 40 }}>
                <option value="">Select an option...</option>
                {(q.options || []).map(o => <option key={o.id} value={o.text}>{o.text}</option>)}
              </select>
            )}
            {q?.type === "nps" && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Array.from({ length: 11 }, (_, i) => i).map(n => (
                  <button key={n} onClick={() => { setCur(n); setErr(""); }}
                    style={{ width: 48, height: 48, borderRadius: 10, border: `2px solid ${cur === n ? theme.primaryColor : theme.textColor + "20"}`, background: cur === n ? theme.primaryColor : "transparent", color: cur === n ? "#fff" : theme.textColor, fontWeight: 700, fontSize: 15, cursor: "pointer", transition: "all 0.15s" }}>
                    {n}
                  </button>
                ))}
              </div>
            )}
            {q?.type === "image_upload" && (
              <div>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith("image/")) handleImageFile(f); }}
                  style={{
                    border: `2px dashed ${dragOver ? theme.primaryColor : theme.primaryColor + "60"}`,
                    borderRadius: 16,
                    padding: 32,
                    textAlign: "center",
                    background: dragOver ? `${theme.primaryColor}08` : "transparent",
                    transition: "all 0.2s",
                    cursor: "pointer",
                  }}
                  onClick={() => (document.getElementById("img-upload-input") as HTMLInputElement)?.click()}
                >
                  {uploadPreview ? (
                    <div>
                      <img src={uploadPreview} alt="preview" style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 12, objectFit: "contain", margin: "0 auto", display: "block" }} />
                      <p style={{ marginTop: 12, fontSize: 14, opacity: 0.6 }}>Click or drag to change image</p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>📤</div>
                      <p style={{ fontSize: 16, fontWeight: 600, color: theme.textColor, marginBottom: 4 }}>Click to upload or drag & drop</p>
                      <p style={{ fontSize: 13, opacity: 0.5 }}>JPG, PNG, WebP — up to 10MB</p>
                    </div>
                  )}
                  <input id="img-upload-input" type="file" accept="image/*" style={{ display: "none" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
                </div>
                {q.required && !uploadPreview && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>* A photo is required</p>}
              </div>
            )}
            {q?.type === "appointment" && (
              <BookingCalendar 
                merchantId={form?.merchant_id || 0} 
                duration={q.duration || 30} 
                primaryColor={theme.primaryColor}
                onSelect={val => { setCur(val); setErr(""); }} 
              />
            )}
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {(idx > 0 || step === "q") && (
              <button onClick={goBack} style={{ padding: "14px 20px", background: `${theme.textColor}10`, color: theme.textColor, border: "none", borderRadius: br, fontWeight: 600, cursor: "pointer", fontSize: 15 }}>
                ← Back
              </button>
            )}
            <button onClick={goNext} disabled={submitting || uploading}
              style={{ ...btnBase, flex: 1, opacity: (submitting || uploading) ? 0.7 : 1 }}>
              {uploading ? "Uploading..." : submitting ? "Submitting..." : btnLabel}
            </button>
          </div>
          {err && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 12, fontWeight: 600, textAlign: "center" }}>{err}</p>}
          <p style={{ marginTop: 12, fontSize: 12, opacity: 0.4, textAlign: "center" }}>
            Press Enter ↵ to continue · {idx + 1} of {qs.length}
          </p>
        </div>
      </div>
    </div>
  );
}
