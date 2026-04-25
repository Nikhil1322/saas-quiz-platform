"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function FormEmbedPage() {
  const { id } = useParams() as { id: string };
  const [publicUrl, setPublicUrl] = useState("");

  useEffect(() => {
    setPublicUrl(window.location.origin);
  }, []);
  const [height, setHeight] = useState("680");
  const [mode, setMode] = useState<"inline"|"popup">("inline");
  const [copied, setCopied] = useState("");
  const [formName, setFormName] = useState("Your Form");
  const [tab, setTab] = useState<"iframe"|"script"|"shopify">("iframe");

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    fetch(`/api/admin/forms/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.name) setFormName(d.name); });
  }, [id]);

  const quizUrl = `${publicUrl}/quiz/${id}`;
  const embedJs = `${publicUrl}/embed.js`;

  const iframeCode = `<iframe\n  src="${quizUrl}"\n  width="100%"\n  height="${height}px"\n  frameborder="0"\n  style="border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,0.1);"\n></iframe>`;

  const scriptInline = `<div id="quiz-${id}"></div>\n<script src="${embedJs}" data-form-id="${id}" data-mode="inline" data-container="quiz-${id}" data-height="${height}"></script>`;

  const scriptPopup = `<button onclick="QuizCRM.open('${id}')"\n  style="background:${`#6366f1`};color:#fff;padding:14px 28px;border:none;border-radius:12px;font-weight:700;font-size:16px;cursor:pointer;">\n  Take the Quiz\n</button>\n<script src="${embedJs}" data-form-id="${id}" data-mode="popup"></script>`;

  const shopifyCode = `{% comment %} Add to any Shopify section or page template {% endcomment %}\n<div class="quiz-section" style="padding:40px 20px;">\n  <iframe\n    src="${quizUrl}"\n    width="100%"\n    height="${height}px"\n    frameborder="0"\n    style="border-radius:16px;max-width:720px;display:block;margin:0 auto;"\n  ></iframe>\n</div>`;

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(() => setCopied(""), 2000);
  };

  const btnCls = (k: string) => `px-5 py-2.5 rounded-xl text-sm font-semibold transition ${copied === k ? "bg-green-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`;

  return (
    <div className="p-6 max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🚀 Embed & Share</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formName}</p>
        </div>
        <a href={quizUrl} target="_blank" className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition">
          👁 Preview Live ↗
        </a>
      </div>

      {/* ngrok URL config */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🌐</span>
          <div className="flex-1">
            <p className="font-semibold text-blue-900 mb-1">Set Your Public URL (ngrok / custom domain)</p>
            <p className="text-sm text-blue-700 mb-3">
              Run <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-xs">ngrok http 3000</code> and paste the URL below. All embed codes update automatically.
            </p>
            <div className="flex gap-2">
              <input value={publicUrl} onChange={e => setPublicUrl(e.target.value.replace(/\/$/, ""))}
                placeholder="https://xxxx.ngrok.io"
                className="flex-1 bg-white border border-blue-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono" />
              <button onClick={() => copy(publicUrl, "url")} className={btnCls("url")}>
                {copied === "url" ? "✓" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Height control */}
      <div className="bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-6">
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Embed Height</p>
          <div className="flex gap-2">
            {["500","600","680","800","100vh"].map(h => (
              <button key={h} onClick={() => setHeight(h)}
                className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition ${height === h ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                {h}
              </button>
            ))}
            <input value={height} onChange={e => setHeight(e.target.value)}
              className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
        </div>
      </div>

      {/* Code tabs */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex border-b">
          {([["iframe","📄 iFrame"],["script","⚡ Script Tag"],["shopify","🛒 Shopify"]] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold transition ${tab === t ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50" : "text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "iframe" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Paste this into any HTML page. Works everywhere — Shopify, WordPress, Webflow.</p>
              <div className="relative">
                <pre className="bg-gray-900 rounded-xl p-4 text-xs text-green-400 font-mono overflow-x-auto whitespace-pre">{iframeCode}</pre>
                <button onClick={() => copy(iframeCode, "iframe")} className={`absolute top-3 right-3 ${btnCls("iframe")} text-xs px-3 py-1.5`}>
                  {copied === "iframe" ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}

          {tab === "script" && (
            <div className="space-y-5">
              <div>
                <div className="flex gap-2 mb-3">
                  {(["inline","popup"] as const).map(m => (
                    <button key={m} onClick={() => setMode(m)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition capitalize ${mode === m ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600"}`}>
                      {m === "inline" ? "📌 Inline" : "💬 Popup"}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {mode === "inline" ? "Embeds directly in your page content." : "Opens quiz in a popup overlay when button is clicked."}
                </p>
                <div className="relative">
                  <pre className="bg-gray-900 rounded-xl p-4 text-xs text-green-400 font-mono overflow-x-auto whitespace-pre">{mode === "inline" ? scriptInline : scriptPopup}</pre>
                  <button onClick={() => copy(mode === "inline" ? scriptInline : scriptPopup, "script")} className={`absolute top-3 right-3 ${btnCls("script")} text-xs px-3 py-1.5`}>
                    {copied === "script" ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "shopify" && (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm">
                <p className="font-semibold text-orange-800 mb-2">📖 How to add to Shopify</p>
                <ol className="text-orange-700 space-y-1.5 list-decimal list-inside">
                  <li>Go to <b>Online Store → Themes → Edit code</b></li>
                  <li>Open any <b>Section</b> or <b>Page template</b> file</li>
                  <li>Paste the code below where you want the quiz to appear</li>
                  <li>Save and preview your store</li>
                </ol>
                <p className="mt-2 text-orange-600 text-xs">💡 For a dedicated quiz page: create a new page in Shopify and use a custom template with this code.</p>
              </div>
              <div className="relative">
                <pre className="bg-gray-900 rounded-xl p-4 text-xs text-green-400 font-mono overflow-x-auto whitespace-pre">{shopifyCode}</pre>
                <button onClick={() => copy(shopifyCode, "shopify")} className={`absolute top-3 right-3 ${btnCls("shopify")} text-xs px-3 py-1.5`}>
                  {copied === "shopify" ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live preview */}
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-1">👁 Live Preview</h2>
        <p className="text-sm text-gray-500 mb-4">Make sure your server is running and the form is published.</p>
        <div className="bg-gray-100 rounded-xl p-4">
          <iframe src={quizUrl} width="100%" height={height.endsWith("vh") ? "600" : height}
            frameBorder={0} style={{ borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.1)", display: "block" }} title="Quiz Preview" />
        </div>
      </div>
    </div>
  );
}
