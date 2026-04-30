"use client";
import { useState, useEffect } from "react";

export default function EmbedPage() {
    const [quizUrl, setQuizUrl] = useState("");

    useEffect(() => {
        setQuizUrl(window.location.origin);
    }, []);
    const [width, setWidth] = useState("100%");
    const [height, setHeight] = useState("680");
    const [borderRadius, setBorderRadius] = useState("16");
    const [shadow, setShadow] = useState(true);
    const [activeTab, setActiveTab] = useState<"iframe" | "script">("iframe");
    const [copied, setCopied] = useState<string | null>(null);

    const iframeStyle = [
        "border: none;",
        `border-radius: ${borderRadius}px;`,
        shadow ? "box-shadow: 0 8px 30px rgba(0,0,0,0.12);" : "",
    ].filter(Boolean).join(" ");

    const iframeCode = `<iframe
  src="${quizUrl}"
  width="${width}"
  height="${height}"
  frameborder="0"
  allowtransparency="true"
  style="${iframeStyle}"
></iframe>`;

    const scriptCode = `<!-- Quiz Widget by Quiz CRM -->
<div id="quiz-widget"></div>
<script>
  (function() {
    var config = {
      apiUrl: 'http://localhost:5000',
      quizUrl: '${quizUrl}',
      containerId: 'quiz-widget',
      height: '${height}px'
    };
    var iframe = document.createElement('iframe');
    iframe.src = config.quizUrl;
    iframe.width = '100%';
    iframe.height = config.height;
    iframe.frameBorder = '0';
    iframe.style.cssText = '${iframeStyle}';
    document.getElementById(config.containerId).appendChild(iframe);
  })();
</script>`;

    const copy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2500);
    };

    return (
        <div className="p-6 max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">🚀 Embed Your Quiz</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Copy the code below and paste it anywhere on your website</p>
                </div>
                <a href="/dashboard/quiz"
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition">
                    ← Back to Quiz Builder
                </a>
            </div>

            {/* Steps banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white">
                <p className="font-bold text-base mb-3">How to embed your quiz</p>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { step: "1", icon: "🎨", title: "Build your quiz", desc: "Use the Quiz Builder to design your form" },
                        { step: "2", icon: "📋", title: "Copy the code", desc: "Copy the iframe or script code below" },
                        { step: "3", icon: "🌐", title: "Paste on website", desc: "Paste into your website HTML anywhere" },
                    ].map(s => (
                        <div key={s.step} className="flex items-start gap-3">
                            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold">{s.step}</div>
                            <div>
                                <p className="font-semibold text-sm">{s.icon} {s.title}</p>
                                <p className="text-xs text-indigo-200 mt-0.5">{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-5 gap-5">
                {/* Left: Code */}
                <div className="col-span-3 space-y-4">
                    {/* URL Config */}
                    <div className="bg-white rounded-2xl border shadow-sm p-5">
                        <h2 className="font-semibold text-gray-900 mb-4">🔗 Quiz URL</h2>
                        <p className="text-sm text-gray-500 mb-3">This is the URL where your quiz is hosted (your quiz frontend)</p>
                        <div className="flex gap-2">
                            <input value={quizUrl} onChange={e => setQuizUrl(e.target.value)}
                                placeholder="http://localhost:3001 or https://your-quiz-site.com"
                                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            <button onClick={() => copy(quizUrl, "url")}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0 ${copied === "url" ? "bg-green-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
                                {copied === "url" ? "✓" : "Copy"}
                            </button>
                        </div>
                    </div>

                    {/* Code output */}
                    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                        <div className="flex border-b">
                            {(["iframe", "script"] as const).map(t => (
                                <button key={t} onClick={() => setActiveTab(t)}
                                    className={`flex-1 py-3 text-sm font-semibold capitalize transition ${activeTab === t ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50" : "text-gray-500 hover:text-gray-700"}`}>
                                    {t === "iframe" ? "📄 iframe Embed" : "⚡ Script Embed"}
                                </button>
                            ))}
                        </div>
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm text-gray-600 font-medium">
                                    {activeTab === "iframe" ? "Paste this code into your website's HTML" : "Paste this anywhere — works on any website"}
                                </p>
                                <button onClick={() => copy(activeTab === "iframe" ? iframeCode : scriptCode, activeTab)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${copied === activeTab ? "bg-green-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
                                    {copied === activeTab ? "✓ Copied!" : "📋 Copy Code"}
                                </button>
                            </div>
                            <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                                <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono leading-relaxed">
                                    {activeTab === "iframe" ? iframeCode : scriptCode}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Customise */}
                <div className="col-span-2 space-y-4">
                    <div className="bg-white rounded-2xl border shadow-sm p-5">
                        <h2 className="font-semibold text-gray-900 mb-4">⚙️ Customise Embed</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Width</label>
                                <div className="flex gap-2">
                                    {["100%", "80%", "600px", "800px"].map(w => (
                                        <button key={w} onClick={() => setWidth(w)}
                                            className={`flex-1 py-1.5 text-xs rounded-lg border font-medium transition ${width === w ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                                            {w}
                                        </button>
                                    ))}
                                </div>
                                <input value={width} onChange={e => setWidth(e.target.value)} placeholder="e.g. 100% or 600px"
                                    className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Height (pixels)</label>
                                <div className="flex gap-2">
                                    {["500", "600", "680", "800"].map(h => (
                                        <button key={h} onClick={() => setHeight(h)}
                                            className={`flex-1 py-1.5 text-xs rounded-lg border font-medium transition ${height === h ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                                            {h}
                                        </button>
                                    ))}
                                </div>
                                <input type="number" value={height} onChange={e => setHeight(e.target.value)}
                                    className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Corner Radius (px)</label>
                                <div className="flex items-center gap-3">
                                    <input type="range" min="0" max="32" value={borderRadius} onChange={e => setBorderRadius(e.target.value)}
                                        className="flex-1 accent-indigo-600" />
                                    <span className="text-xs font-mono text-gray-600 w-10">{borderRadius}px</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Drop Shadow</p>
                                    <p className="text-xs text-gray-400">Adds a soft shadow around the quiz</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={shadow} onChange={e => setShadow(e.target.checked)} className="sr-only peer" />
                                    <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 transition after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition peer-checked:after:translate-x-4" />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <p className="text-sm font-semibold text-amber-800 mb-2">💡 Tips</p>
                        <ul className="text-xs text-amber-700 space-y-1.5">
                            <li>• Use <b>100% width</b> for full-width sections on your website</li>
                            <li>• The quiz fetches its settings from your CRM automatically</li>
                            <li>• All leads from the embedded quiz appear in your Dashboard</li>
                            <li>• Works on Shopify, WordPress, Webflow, and plain HTML</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-2xl border shadow-sm p-5">
                <h2 className="font-semibold text-gray-900 mb-1">👁️ Live Embed Preview</h2>
                <p className="text-sm text-gray-500 mb-4">This is how your quiz will appear when embedded. Make sure your quiz app is running at the URL above.</p>
                <div className="bg-gray-100 rounded-xl p-4">
                    <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: shadow ? "0 8px 30px rgba(0,0,0,0.12)" : "none", borderRadius: `${borderRadius}px` }}>
                        <iframe
                            src={quizUrl}
                            width={width}
                            height={height}
                            frameBorder={0}
                            className="block"
                            title="Quiz Preview"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
