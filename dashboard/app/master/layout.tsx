"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function MasterLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLogin = pathname === "/master";
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!isLogin && !localStorage.getItem("master_token")) {
            window.location.href = "/master";
        }
    }, [isLogin]);

    const logout = () => {
        localStorage.removeItem("master_token");
        localStorage.removeItem("master_role");
        window.location.href = "/master";
    };

    if (!mounted) return null;

    if (isLogin) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-slate-950 text-slate-300 flex flex-col shadow-2xl z-10">
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="text-white text-lg">⚡</span>
                        </div>
                        <div>
                            <h2 className="text-white font-bold tracking-wide">Master Panel</h2>
                            <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold mt-0.5">SaaS Admin</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1.5 mt-4">
                    <Link href="/master/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${pathname === "/master/dashboard" ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "hover:bg-slate-900 hover:text-white"}`}>
                        📊 Overview
                    </Link>
                    <Link href="/master/merchants" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${pathname.includes("/master/merchants") ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "hover:bg-slate-900 hover:text-white"}`}>
                        🏢 Merchants
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl transition font-medium hover:bg-slate-900 hover:text-red-400 text-slate-400">
                        🚪 Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    );
}
