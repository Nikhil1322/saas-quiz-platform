"use client";
import { useEffect, useState } from "react";

type ProfileData = { 
  id: number; 
  username: string; 
  role: string; 
  created_at: string; 
  brand_name: string; 
  subdomain: string;
};

export default function ProfilePage() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState({ brand_name: "", subdomain: "" });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const token = localStorage.getItem("merchant_token");
        if (!token) { window.location.href = "/"; return; }

        try {
            const r = await fetch("/api/admin/profile", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await r.json();
            if (r.status === 401) { localStorage.clear(); window.location.href = "/"; return; }
            if (data.msg) { setError(`Error: ${data.msg}`); return; }
            setProfile(data);
            setEditData({ brand_name: data.brand_name || "", subdomain: data.subdomain || "" });
        } catch (err) {
            setError("Cannot connect to server. Make sure the backend is running.");
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem("merchant_token");
        try {
            const res = await fetch("/api/admin/merchant/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(editData),
            });
            if (res.ok) {
                alert("Profile updated successfully!");
                fetchProfile();
            } else {
                const data = await res.json();
                alert(data.msg || "Failed to update profile");
            }
        } catch (err) {
            alert("Network error. Please try again.");
        }
        setSaving(false);
    };

    const logout = () => { localStorage.clear(); window.location.href = "/"; };

    if (error) return (
        <div className="p-6 max-w-lg">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <p className="font-semibold text-red-800 mb-2">⚠️ Profile Error</p>
                <p className="text-sm text-red-700">{error}</p>
                <button onClick={logout} className="mt-4 bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition">Sign Out & Re-login</button>
            </div>
        </div>
    );

    if (!profile) return (
        <div className="p-8 flex items-center gap-4 text-gray-400 font-black uppercase tracking-widest text-xs">
            <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Loading profile...
        </div>
    );

    const isMaster = profile.role === "master";

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Profile Settings</h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Info Card */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-indigo-100 overflow-hidden">
                        <div className="h-32 bg-gradient-to-br from-indigo-600 to-purple-700" />
                        <div className="px-8 pb-8">
                            <div className="relative -mt-12 mb-6">
                                <div className="w-24 h-24 bg-white rounded-3xl border-8 border-white shadow-xl flex items-center justify-center text-4xl font-black text-indigo-600">
                                    {profile.username?.charAt(0).toUpperCase()}
                                </div>
                                <span className="absolute bottom-0 right-0 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-full shadow-lg">
                                    {profile.role}
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-gray-900">{profile.username}</h2>
                            <p className="text-gray-400 font-bold text-sm mt-1">{profile.brand_name || "Merchant"} Profile</p>
                            
                            <div className="mt-8 space-y-4">
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-gray-400">Account ID</span>
                                    <span className="text-gray-900">#{profile.id}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-gray-400">Member Since</span>
                                    <span className="text-gray-900">{new Date(profile.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <button onClick={logout} className="mt-8 w-full py-4 rounded-2xl bg-red-50 text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95">
                                Sign Out Session
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Settings Form */}
                <div className="lg:col-span-7">
                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-10 space-y-8">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Business Identity</h3>
                            <p className="text-gray-400 font-medium text-sm">Customize your brand appearance and public booking URL.</p>
                        </div>

                        <form onSubmit={handleSave} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Brand Name</label>
                                <input 
                                    value={editData.brand_name}
                                    onChange={(e) => setEditData({...editData, brand_name: e.target.value})}
                                    placeholder="Your Business Name"
                                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-3xl px-6 py-4 font-bold text-gray-900 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Public Subdomain</label>
                                <div className="flex items-center gap-2 bg-gray-50 border-2 border-gray-50 rounded-3xl px-6 py-4 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                                    <span className="text-gray-300 font-black tracking-tight">/book/</span>
                                    <input 
                                        value={editData.subdomain}
                                        onChange={(e) => setEditData({...editData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})}
                                        placeholder="unique-slug"
                                        className="bg-transparent flex-1 font-black text-indigo-600 outline-none"
                                    />
                                    <span className="text-gray-300 font-black text-xs">/event</span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold ml-1">This forms your public booking link. Use only lowercase letters and numbers.</p>
                            </div>

                            <div className="pt-4">
                                <button 
                                    type="submit"
                                    disabled={saving || !isMaster}
                                    className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-200 text-white font-black py-5 rounded-3xl shadow-2xl transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
                                >
                                    {saving ? "Saving Changes..." : isMaster ? "Update Business Profile" : "Master Admin Only"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
