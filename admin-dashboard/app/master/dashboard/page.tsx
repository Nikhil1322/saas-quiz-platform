"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MasterDashboard() {
    const [stats, setStats] = useState({ merchants: 0, mrr: 0, leads: 0, forms: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("master_token");
        if (!token) { window.location.href = "/master"; return; }

        fetch("/api/master/stats", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(data => {
            setStats(data);
            setLoading(false);
        })
        .catch(() => {
            localStorage.removeItem("master_token");
            window.location.href = "/master";
        });
    }, []);

    if (loading) return <div className="p-10 text-center text-slate-500">Loading master stats...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">SaaS Overview</h1>
                <p className="text-slate-500 mt-1">Monitor your platform's growth and revenue.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="shadow-sm border-slate-200/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Merchants</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-slate-900">{stats.merchants}</div>
                        <p className="text-sm text-emerald-600 font-medium mt-1">↑ Active clients</p>
                    </CardContent>
                </Card>
                
                <Card className="shadow-sm border-slate-200/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Monthly Recurring Rev</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-slate-900">₹{stats.mrr.toLocaleString('en-IN')}</div>
                        <p className="text-sm text-emerald-600 font-medium mt-1">↑ Expected this month</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Leads Collected</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-slate-900">{stats.leads.toLocaleString()}</div>
                        <p className="text-sm text-slate-400 mt-1">Across all merchants</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Forms</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-slate-900">{stats.forms}</div>
                        <p className="text-sm text-slate-400 mt-1">Active quizzes</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="shadow-sm border-slate-200/60 h-96 flex flex-col items-center justify-center bg-slate-50/50">
                    <div className="text-6xl mb-4">📈</div>
                    <h3 className="text-lg font-bold text-slate-700">Revenue Growth Chart</h3>
                    <p className="text-sm text-slate-400">Add Recharts integration here</p>
                </Card>
                <Card className="shadow-sm border-slate-200/60 h-96 flex flex-col items-center justify-center bg-slate-50/50">
                    <div className="text-6xl mb-4">🏢</div>
                    <h3 className="text-lg font-bold text-slate-700">Merchant Acquisition</h3>
                    <p className="text-sm text-slate-400">Add Recharts integration here</p>
                </Card>
            </div>
        </div>
    );
}
