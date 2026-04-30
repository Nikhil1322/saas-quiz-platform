"use client";
import { useState, useEffect } from "react";

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        quizTitle: "Skin Analysis Quiz",
        quizDescription: "Discover your perfect skincare routine",
        primaryColor: "#6366f1",
        quizUrl: "",
        whatsapp: "",
        email: "",
        logoUrl: "",
        showProgressBar: true,
        allowBack: true,
        thankYouMessage: "Thank you! We'll be in touch shortly with your personalized routine. 💆‍♀️",
    });
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setSettings(s => ({ ...s, quizUrl: window.location.origin }));
    }, []);

    const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
    const copyUrl = () => { navigator.clipboard.writeText(settings.quizUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-900 text-base pb-3 border-b">{title}</h2>
            {children}
        </div>
    );

    const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
        <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
            {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
            {children}
        </div>
    );

    const Input = ({ value, onChange, placeholder, type = "text" }: any) => (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
    );

    return (
        <div className="p-6 max-w-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">⚙️ Settings</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Configure your quiz platform and branding</p>
                </div>
                <button onClick={save}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-md shadow-indigo-200">
                    {saved ? "✓ Saved!" : "Save Changes"}
                </button>
            </div>

            {/* Branding */}
            <Section title="🎨 Branding">
                <Field label="Quiz Name">
                    <Input value={settings.quizTitle} onChange={(e: any) => setSettings(s => ({ ...s, quizTitle: e.target.value }))} placeholder="e.g. Skin Analysis Quiz" />
                </Field>
                <Field label="Tagline / Description">
                    <Input value={settings.quizDescription} onChange={(e: any) => setSettings(s => ({ ...s, quizDescription: e.target.value }))} placeholder="Short description shown below the title" />
                </Field>
                <Field label="Logo URL" hint="Optional — paste a direct link to your logo image">
                    <Input value={settings.logoUrl} onChange={(e: any) => setSettings(s => ({ ...s, logoUrl: e.target.value }))} placeholder="https://yoursite.com/logo.png" />
                </Field>
                <Field label="Brand Color">
                    <div className="flex items-center gap-3">
                        <input type="color" value={settings.primaryColor} onChange={e => setSettings(s => ({ ...s, primaryColor: e.target.value }))}
                            className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer" />
                        <div>
                            <p className="text-sm font-mono text-gray-700">{settings.primaryColor}</p>
                            <p className="text-xs text-gray-400">Used for buttons, accents, and highlights</p>
                        </div>
                        <div className="ml-auto flex gap-2">
                            {["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#14b8a6"].map(c => (
                                <button key={c} onClick={() => setSettings(s => ({ ...s, primaryColor: c }))}
                                    style={{ backgroundColor: c }}
                                    className={`w-7 h-7 rounded-full border-2 transition ${settings.primaryColor === c ? "border-gray-800 scale-110" : "border-transparent"}`} />
                            ))}
                        </div>
                    </div>
                </Field>
            </Section>

            {/* Quiz Link */}
            <Section title="🔗 Quiz Link">
                <Field label="Quiz URL" hint="Share this link with your customers to start the quiz">
                    <div className="flex gap-2">
                        <input readOnly value={settings.quizUrl}
                            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-600 focus:outline-none" />
                        <button onClick={copyUrl}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${copied ? "bg-green-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
                            {copied ? "✓ Copied!" : "Copy"}
                        </button>
                    </div>
                </Field>
                <Field label="Quiz URL" onChange={undefined}>
                    <Input value={settings.quizUrl} onChange={(e: any) => setSettings(s => ({ ...s, quizUrl: e.target.value }))} placeholder="http://localhost:3001" />
                </Field>
            </Section>

            {/* Contact */}
            <Section title="📱 Contact Info">
                <Field label="WhatsApp Number" hint="Used for the 'Message' button next to each lead">
                    <Input value={settings.whatsapp} onChange={(e: any) => setSettings(s => ({ ...s, whatsapp: e.target.value }))} placeholder="+91 98765 43210" />
                </Field>
                <Field label="Support Email">
                    <Input value={settings.email} onChange={(e: any) => setSettings(s => ({ ...s, email: e.target.value }))} placeholder="hello@yourcompany.com" type="email" />
                </Field>
            </Section>

            {/* Quiz Behaviour */}
            <Section title="🎛️ Quiz Behaviour">
                <div className="space-y-4">
                    {[
                        { key: "showProgressBar", label: "Show progress bar", hint: "Display a progress indicator at the top of each question" },
                        { key: "allowBack", label: "Allow going back", hint: "Let users navigate to the previous question" },
                    ].map(item => (
                        <div key={item.key} className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-700">{item.label}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{item.hint}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer mt-0.5 shrink-0">
                                <input type="checkbox" checked={(settings as any)[item.key]}
                                    onChange={e => setSettings(s => ({ ...s, [item.key]: e.target.checked }))} className="sr-only peer" />
                                <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 transition after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition peer-checked:after:translate-x-4" />
                            </label>
                        </div>
                    ))}
                </div>
                <Field label="Thank You Message" hint="Shown to users after they complete the quiz">
                    <textarea value={settings.thankYouMessage}
                        onChange={e => setSettings(s => ({ ...s, thankYouMessage: e.target.value }))}
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                </Field>
            </Section>

            {/* Integrations */}
            <Section title="🔌 Integrations (Webhooks & API)">
                <Field label="Webhook URL" hint="We will send a POST request with lead data here whenever a new lead is captured">
                    <div className="flex gap-2">
                        <Input value={(settings as any).webhookUrl || ""} 
                               onChange={(e: any) => setSettings(s => ({ ...s, webhookUrl: e.target.value }))} 
                               placeholder="https://your-server.com/webhook" />
                        <button onClick={async () => {
                            const res = await fetch("/api/admin/settings/webhook", {
                                method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + localStorage.getItem("merchant_token") },
                                body: JSON.stringify({ webhook_url: (settings as any).webhookUrl })
                            });
                            if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
                        }}
                            className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
                            Save Webhook
                        </button>
                    </div>
                </Field>
                <Field label="API Key" hint="Use this key to authenticate your custom integrations">
                    <div className="flex gap-2">
                        <input readOnly value={(settings as any).apiKey || "••••••••••••••••••••••••"}
                            type="password"
                            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-600 focus:outline-none" />
                        <button onClick={async () => {
                            if (!confirm("Generate a new API Key? Your old key will stop working immediately.")) return;
                            const res = await fetch("/api/admin/settings/apikey", {
                                method: "POST", headers: { "Authorization": "Bearer " + localStorage.getItem("merchant_token") }
                            });
                            const data = await res.json();
                            if (data.api_key) setSettings(s => ({ ...s, apiKey: data.api_key }));
                        }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-sm font-semibold transition">
                            Regenerate Key
                        </button>
                    </div>
                </Field>
            </Section>
        </div>
    );
}
