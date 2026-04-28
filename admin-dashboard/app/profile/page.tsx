"use client";
import { useEffect, useState } from "react";

type ProfileData = {
    username: string;
    role: string;
    created_at: string;
};

export default function Profile() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("merchant_token");
        if (!token) { window.location.href = "/"; return; }

        fetch("/api/admin/profile", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.status === 401) { localStorage.clear(); window.location.href = "/"; }
                return res.json();
            })
            .then((data) => setProfile(data))
            .catch(() => setError("Could not load profile"));
    }, []);

    const logout = () => {
        localStorage.clear();
        window.location.href = "/";
    };

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <p className="text-red-500">{error}</p>
        </div>
    );

    if (!profile) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-pulse text-gray-400">Loading profile...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* NAV */}
            <nav className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <a href="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-bold">⚡</span>
                        </div>
                        <span className="font-bold text-gray-900">Quiz CRM</span>
                    </a>
                </div>
                <div className="flex items-center gap-4">
                    <a href="/dashboard" className="text-sm text-gray-600 hover:text-indigo-600 transition">Dashboard</a>
                    <button onClick={logout} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="max-w-lg mx-auto mt-12 px-4">
                <div className="bg-white rounded-2xl shadow-sm border p-8">
                    {/* AVATAR */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-white text-3xl font-bold">
                                {profile.username?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">{profile.username}</h1>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${profile.role === "master"
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-gray-100 text-gray-600"
                            }`}>
                            {profile.role === "master" ? "👑 Master Admin" : "👤 Staff"}
                        </span>
                    </div>

                    {/* DETAILS */}
                    <div className="space-y-4 border-t pt-6">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Username</span>
                            <span className="text-sm font-medium text-gray-900">{profile.username}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Role</span>
                            <span className="text-sm font-medium text-gray-900 capitalize">{profile.role}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Member since</span>
                            <span className="text-sm font-medium text-gray-900">
                                {profile.created_at
                                    ? new Date(profile.created_at).toLocaleDateString("en-IN", {
                                        day: "numeric", month: "long", year: "numeric"
                                    })
                                    : "—"}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="w-full mt-8 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2.5 rounded-xl transition border border-red-200"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
