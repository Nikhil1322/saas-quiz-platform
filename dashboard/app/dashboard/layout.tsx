"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const NAV = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/dashboard/forms", label: "My Forms", icon: "📋" },
    { href: "/dashboard/bookings", label: "Bookings", icon: "📅" },
    { href: "/dashboard/event-types", label: "Booking Settings", icon: "⚡" },
    { href: "/dashboard/availability", label: "Availability", icon: "⏰" },
    { href: "/dashboard/meetings", label: "Meetings", icon: "📹" },
    { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
    { href: "/dashboard/profile", label: "Profile", icon: "👤" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [role, setRole] = useState("");
    const [username, setUsername] = useState("");
    const [collapsed, setCollapsed] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("merchant_token");
        if (!token) { window.location.href = "/"; return; }
        setRole(localStorage.getItem("role") || "");
        setUsername(localStorage.getItem("username") || "");
        
        fetch("/api/admin/profile", { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => { setProfile(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const allNav = role === "master"
        ? [NAV[0], { href: "/dashboard/users", label: "Staff", icon: "👥", badge: "Merchant" }, ...NAV.slice(1)]
        : NAV;

    const initial = username?.charAt(0).toUpperCase() || "A";

    // Subscription check
    const trialExpired = profile && profile.plan_status !== 'active' && new Date(profile.trial_ends_at) < new Date();
    const daysLeft = profile && profile.trial_ends_at ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 3600 * 24))) : 0;
    const isTrial = profile && profile.plan_status === 'trial';

    if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-400">Loading...</div>;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden flex-col">
            {/* ── TOP BANNER ── */}
            {isTrial && !trialExpired && (
                <div className="bg-amber-50 border-b border-amber-200 py-2 px-4 text-center">
                    <p className="text-amber-800 text-sm font-medium">
                        You are on a 14-day free trial. You have <span className="font-bold">{daysLeft} days</span> remaining. 
                        Please upgrade your plan to avoid interruption.
                    </p>
                </div>
            )}
            
            <div className="flex flex-1 overflow-hidden">
                {/* ── SIDEBAR ── */}
                <aside className={`${collapsed ? "w-16" : "w-60"} bg-gray-950 flex flex-col transition-all duration-300 shrink-0`}>
                    {/* Logo */}
                    <div className={`flex items-center ${collapsed ? "justify-center px-3" : "gap-3 px-5"} py-4 border-b border-gray-800`}>
                        <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-sm">⚡</span>
                        </div>
                        {!collapsed && (
                            <div>
                                <p className="text-white font-bold text-sm leading-none">{profile?.brand_name || "Quiz CRM"}</p>
                                <p className="text-gray-500 text-xs mt-0.5">Merchant Panel</p>
                            </div>
                        )}
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                        {allNav.map(item => {
                            const active = pathname === item.href;
                            return (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    title={collapsed ? item.label : undefined}
                                    className={`flex items-center ${collapsed ? "justify-center px-0" : "gap-3 px-3"} py-2.5 rounded-xl text-sm font-medium transition-all ${active
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                                        : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
                                >
                                    <span className="text-base shrink-0">{item.icon}</span>
                                    {!collapsed && (
                                        <>
                                            <span className="flex-1">{item.label}</span>
                                            {"badge" in item && (
                                                <span className="text-xs bg-indigo-900 text-indigo-300 px-1.5 py-0.5 rounded-md">{(item as any).badge}</span>
                                            )}
                                        </>
                                    )}
                                </a>
                            );
                        })}
                    </nav>

                    {/* Bottom */}
                    <div className="p-3 border-t border-gray-800 space-y-2">
                        <a
                            href="/dashboard/profile"
                            className={`flex items-center ${collapsed ? "justify-center" : "gap-3 px-3"} py-2 rounded-xl hover:bg-gray-800 transition group`}
                        >
                            <div className="w-8 h-8 bg-indigo-700 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-white font-bold text-sm">{initial}</span>
                            </div>
                            {!collapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{username || "Admin"}</p>
                                    <p className="text-gray-500 text-xs capitalize">{role}</p>
                                </div>
                            )}
                        </a>
                        <button
                            onClick={() => setCollapsed(c => !c)}
                            className="w-full text-gray-600 hover:text-gray-300 text-xs py-1.5 rounded-lg hover:bg-gray-800 transition"
                        >
                            {collapsed ? "→" : "← Collapse"}
                        </button>
                        <button
                            onClick={() => { localStorage.clear(); window.location.href = "/"; }}
                            className="w-full text-red-500 hover:text-red-400 text-xs py-1.5 rounded-lg hover:bg-gray-800 transition"
                        >
                            {collapsed ? "⏻" : "Sign Out"}
                        </button>
                    </div>
                </aside>

                {/* ── MAIN CONTENT ── */}
                <main className="flex-1 overflow-auto bg-gray-50 relative">
                    {trialExpired && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
                            <div className="bg-white border shadow-2xl rounded-2xl p-8 max-w-md text-center space-y-4">
                                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl">
                                    🔒
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Subscription Expired</h2>
                                <p className="text-gray-500">
                                    Your 14-day free trial has expired. Please upgrade your plan to continue accessing your dashboard and leads.
                                </p>
                                <button className="bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl w-full hover:bg-indigo-700 transition">
                                    Upgrade Plan Now
                                </button>
                            </div>
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
}
