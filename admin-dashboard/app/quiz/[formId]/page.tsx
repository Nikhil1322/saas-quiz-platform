"use client";
// Uses relative /api/* paths — works on localhost AND ngrok/any domain
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

type QType = "short_text"|"phone"|"email"|"number"|"single_choice"|"multi_choice"|"image_choice"|"image_upload"|"rating"|"dropdown"|"nps";
type Option = { id: string; text: string; imageUrl?: string };
type LogicJump = { condition: string; value: string; goTo: string };
type Q = { id: string; label: string; description: string; key: string; type: QType; required: boolean; placeholder: string; options: Option[]; section: string; imageUrl: string; maxRating: number; logicJumps?: LogicJump[] };
type Theme = { primaryColor: string; bgColor: string; textColor: string; buttonStyle: string };
type Cfg = { title: string; description: string; logoUrl: string; theme: Theme; questions: Q[]; welcomeBtn: string; thankYouTitle: string; thankYouDesc: string; buttonText: string; submitText: string };

// All API calls use relative paths → proxied server-side → works through ngrok

export default function QuizRenderer() {
  const { formId } = useParams() as { formId: string };
  const [form, setForm] = useState<{ id: number; config: Cfg } | null>(null);
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
  // For image_upload questions: stores File object before upload, URL after upload
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
    // For image_upload: upload the file first, then proceed
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
        // Store the URL as the answer then proceed
        const newAns = { ...answers, [q.key]: uploadedUrl };
        setAnswers(newAns);
        setUploadFile(null);
        const ni = nextIdx(q, uploadedUrl);
        if (ni >= qs.length) {
          setSubmitting(true);
          const name = newAns.full_name || newAns.name || "";
          const phone = newAns.phone || newAns.whatsapp || "";
          try { await fetch(`/api/quiz`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone, answers: newAns, formId: form?.id, result: "completed" }) }); } catch {}
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
      try { await fetch(`/api/quiz`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone, answers: newAns, formId: form?.id, result: "completed" }) }); } catch {}
      setSubmitting(false);
      animate(1, () => setStep("done"));
    } else {
      animate(1, () => { setIdx(ni); setCur(newAns[qs[ni]?.key] ?? null); });
    }
  }, [q, cur, answers, nextIdx, qs, form?.id, uploadFile]);

  // Reset upload state when question changes
  useEffect(() => {
    setUploadFile(null);
    setUploadPreview(cur && typeof cur === "string" && cur.startsWith("http") ? cur : "");
  }, [idx]);

  // Handle file selection for image_upload
  const handleImageFile = (file: File) => {
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
    setCur(null); // will be replaced by URL after upload
    setErr("");
  };

  const goBack = () => {
    if (idx === 0) { animate(-1, () => setStep("welcome")); return; }
    setAnswers(a => ({ ...a, [q.key]: cur }));
    animate(-1, () => { setIdx(i => i - 1); setCur(answers[qs[idx - 1]?.key] ?? null); });
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Enter" && step === "q" && q?.type !== "multi_choice") goNext(); };
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

  // Welcome screen
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

  // Thank you
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

  // Question screen
  const isLast = idx === qs.length - 1;
  const btnLabel = isLast ? (cfg?.submitText || "Submit ✨") : (cfg?.buttonText || "Continue →");

  return (
    <div style={s}>
      {/* Progress bar */}
      <div style={{ height: 4, background: `${theme.primaryColor}20`, flexShrink: 0 }}>
        <div style={{ height: "100%", background: theme.primaryColor, width: `${progress}%`, transition: "width 0.4s ease" }} />
      </div>

      {/* Logo */}
      <div style={{ padding: "16px 24px", flexShrink: 0 }}>
        {cfg?.logoUrl && <img src={cfg.logoUrl} alt="" style={{ height: 32, objectFit: "contain" }} />}
      </div>

      {/* Question */}
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

          {/* Answers */}
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
          </div>

          {/* Nav buttons */}
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
          <p style={{ marginTop: 12, fontSize: 12, opacity: 0.4, textAlign: "center" }}>
            Press Enter ↵ to continue · {idx + 1} of {qs.length}
          </p>
        </div>
      </div>
    </div>
  );
}
