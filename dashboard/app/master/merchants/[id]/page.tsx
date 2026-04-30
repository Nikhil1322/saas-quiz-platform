"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MerchantDetails() {
    const { id } = useParams() as { id: string };
    const [merchant, setMerchant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState("");

    useEffect(() => {
        const t = localStorage.getItem("master_token");
        if (!t) { window.location.href = "/master"; return; }
        setToken(t);
        loadMerchant(t);
    }, [id]);

    const loadMerchant = async (t: string) => {
        setLoading(true);
        try {
            const res = await fetch("/api/master/merchants", { headers: { Authorization: `Bearer ${t}` } });
            const data = await res.json();
            const found = Array.isArray(data) ? data.find((m: any) => m.id.toString() === id) : null;
            setMerchant(found);
        } catch {
            setMerchant(null);
        }
        setLoading(false);
    };

    const updateStatus = async (plan_status: string) => {
        if (!merchant) return;
        const res = await fetch(`/api/master/merchants/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ plan: merchant.plan, plan_status, monthly_amount: merchant.monthly_amount })
        });
        if (res.ok) {
            setMerchant({ ...merchant, plan_status });
            alert("Subscription status updated");
        } else {
            alert("Failed to update status");
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Loading details...</div>;
    if (!merchant) return <div className="p-10 text-center text-red-500">Merchant not found.</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{merchant.brand_name}</h1>
                    <p className="text-slate-500 mt-1">{merchant.email}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => window.history.back()}>Back</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm border-slate-200/60">
                    <CardHeader>
                        <CardTitle className="text-lg">Subscription Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-500 font-medium text-sm">Plan Name</span>
                            <span className="font-semibold capitalize">{merchant.plan}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-500 font-medium text-sm">Monthly MRR</span>
                            <span className="font-semibold text-emerald-600">₹{merchant.monthly_amount}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-500 font-medium text-sm">Current Status</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${merchant.plan_status === 'active' ? 'bg-emerald-100 text-emerald-700' : merchant.plan_status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {merchant.plan_status}
                            </span>
                        </div>
                        
                        <div className="pt-4 flex gap-3">
                            <Button onClick={() => updateStatus("active")} disabled={merchant.plan_status === "active"} className="bg-emerald-600 hover:bg-emerald-700 flex-1">
                                Mark Active
                            </Button>
                            <Button onClick={() => updateStatus("cancelled")} disabled={merchant.plan_status === "cancelled"} variant="destructive" className="flex-1">
                                Cancel Plan
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200/60">
                    <CardHeader>
                        <CardTitle className="text-lg">Account Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-500 font-medium text-sm">Owner Name</span>
                            <span className="font-semibold">{merchant.name}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-500 font-medium text-sm">Joined Date</span>
                            <span className="font-semibold">{new Date(merchant.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-500 font-medium text-sm">Total Leads</span>
                            <span className="font-semibold">{merchant.leads_count || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-slate-500 font-medium text-sm">Total Forms</span>
                            <span className="font-semibold">{merchant.forms_count || 0}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
