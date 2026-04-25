"use client";
import { useEffect, useState } from "react";

type ProfileData = { id: number; username: string; role: string; created_at: string; };

export default function ProfilePage() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) { window.location.href = "/"; return; }

        fetch("/api/admin/profile", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async r => {
                const data = await r.json();
                if (r.status === 401) { localStorage.clear(); window.location.href = "/"; return; }
                if (data.msg) { setError(`Error: ${data.msg}`); return; }
                setProfile(data);
            })
            .catch(() => setError("Cannot connect to server. Make sure the backend is running."));
    }, []);

    const logout = () => { localStorage.clear(); window.location.href = "/"; };

    if (error) return (
        <div className="p-6 max-w-lg">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <p className="font-semibold text-red-800 mb-2">⚠️ Profile Error</p>
                <p className="text-sm text-red-700">{error}</p>
                <p className="text-xs text-red-500 mt-3">Try: sign out and log in again to refresh your session token.</p>
                <button onClick={logout} className="mt-4 bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition">Sign Out & Re-login</button>
            </div>
        </div>
    );

    if (!profile) return (
        <div className="p-6 flex items-center gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Loading profile...
        </div>
    );

    const initial = profile.username?.charAt(0).toUpperCase() || "A";
    const isMaster = profile.role === "master";

    return (
        <div className="p-6 max-w-xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">👤 My Profile</h1>

            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                {/* Banner */}
                <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600" />

                {/* Profile */}
                <div className="px-6 pb-6">
                    <div className="flex items-end justify-between -mt-10 mb-5">
                        <div className="w-20 h-20 bg-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center">
                            <span className="text-3xl font-bold text-indigo-600">{initial}</span>
                        </div>
                        <span className={`mb-1 px-3 py-1.5 rounded-xl text-sm font-semibold ${isMaster ? "bg-indigo-100 text-indigo-700 border border-indigo-200" : "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                            {isMaster ? "👑 Master Admin" : "👤 Staff"}
                        </span>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900">{profile.username}</h2>
                    <p className="text-sm text-gray-500 mt-0.5 capitalize">{profile.role} — Quiz CRM</p>

                    <div className="mt-6 space-y-3 border-t pt-5">
                        {[
                            { label: "Username", value: profile.username },
                            { label: "Role", value: isMaster ? "Master Administrator" : "Staff Member" },
                            { label: "Member Since", value: profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—" },
                            { label: "Permissions", value: isMaster ? "Full access (leads, users, quiz editor, settings)" : "Leads view & status updates" },
                        ].map(item => (
                            <div key={item.label} className="flex justify-between items-start gap-4">
                                <span className="text-sm text-gray-500 shrink-0">{item.label}</span>
                                <span className="text-sm font-medium text-gray-900 text-right">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-4 bg-white rounded-2xl border shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Account Actions</h3>
                <div className="space-y-2">
                    <button onClick={logout}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium transition">
                        <span>Sign Out</span>
                        <span>→</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
