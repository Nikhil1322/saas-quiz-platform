"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MasterMerchants() {
    const [merchants, setMerchants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState("");

    const [showNew, setShowNew] = useState(false);
    const [newM, setNewM] = useState({ name: "", email: "", password: "", brand_name: "" });
    const [editing, setEditing] = useState<any>(null);

    useEffect(() => {
        const t = localStorage.getItem("master_token");
        if (!t) { window.location.href = "/master"; return; }
        setToken(t);
        loadMerchants(t);
    }, []);

    const loadMerchants = (t: string) => {
        setLoading(true);
        fetch("/api/master/merchants", { headers: { Authorization: `Bearer ${t}` } })
        .then(r => r.json())
        .then(d => { setMerchants(Array.isArray(d) ? d : []); setLoading(false); });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/master/merchants", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(newM)
        });
        if (res.ok) {
            setShowNew(false);
            setNewM({ name: "", email: "", password: "", brand_name: "" });
            loadMerchants(token);
        } else {
            const data = await res.json();
            alert(data.msg || "Error creating merchant");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this merchant? This is permanent.")) return;
        await fetch(`/api/master/merchants/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
        loadMerchants(token);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch(`/api/master/merchants/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                email: editing.email,
                password: editing.password,
                brand_name: editing.brand_name,
                plan: editing.plan,
                plan_status: editing.plan_status,
                monthly_amount: editing.monthly_amount,
                trial_ends_at: editing.trial_ends_at
            })
        });
        if (res.ok) {
            setEditing(null);
            loadMerchants(token);
        } else {
            alert("Error updating merchant");
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Loading merchants...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Merchants</h1>
                    <p className="text-slate-500 mt-1">Manage SaaS client accounts and subscriptions.</p>
                </div>
                <Button onClick={() => setShowNew(!showNew)} className="bg-blue-600 hover:bg-blue-700">
                    {showNew ? "Cancel" : "+ Add Merchant"}
                </Button>
            </div>

            {showNew && (
                <Card className="border-blue-200 shadow-blue-100">
                    <CardHeader>
                        <CardTitle className="text-lg">Create New Merchant Account</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Owner Name</label>
                                <Input required value={newM.name} onChange={e => setNewM(m => ({...m, name: e.target.value}))} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Brand Name</label>
                                <Input required value={newM.brand_name} onChange={e => setNewM(m => ({...m, brand_name: e.target.value}))} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Email (Login)</label>
                                <Input type="email" required value={newM.email} onChange={e => setNewM(m => ({...m, email: e.target.value}))} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Password</label>
                                <Input type="password" required value={newM.password} onChange={e => setNewM(m => ({...m, password: e.target.value}))} />
                            </div>
                            <div className="md:col-span-2 pt-2">
                                <Button type="submit" className="w-full md:w-auto">Create Account</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card className="shadow-sm border-slate-200/60 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-6 py-4 font-semibold text-slate-500 uppercase text-xs tracking-wider">Brand</th>
                            <th className="text-left px-6 py-4 font-semibold text-slate-500 uppercase text-xs tracking-wider">Plan</th>
                            <th className="text-left px-6 py-4 font-semibold text-slate-500 uppercase text-xs tracking-wider">MRR</th>
                            <th className="text-left px-6 py-4 font-semibold text-slate-500 uppercase text-xs tracking-wider">Joined</th>
                            <th className="text-right px-6 py-4 font-semibold text-slate-500 uppercase text-xs tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {merchants.map(m => (
                            <tr key={m.id} className="hover:bg-slate-50 transition">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{m.brand_name}</div>
                                    <div className="text-slate-500 mt-0.5">{m.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${m.plan_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {m.plan_status.toUpperCase()} ({m.plan})
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-700">
                                    ₹{m.monthly_amount}
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-xs">
                                    {new Date(m.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right space-x-4">
                                    <button onClick={() => setEditing(m)} className="text-indigo-600 hover:text-indigo-800 font-medium text-xs transition">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:text-red-700 font-medium text-xs transition">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {merchants.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    <p className="text-3xl mb-3">🏢</p>
                                    <p>No merchants yet. Add your first client above.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>

            {/* EDIT MODAL */}
            {editing && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                        <CardHeader className="border-b bg-slate-50 flex flex-row items-center justify-between sticky top-0 z-10">
                            <div>
                                <CardTitle>Edit Merchant: {editing.brand_name}</CardTitle>
                                <p className="text-sm text-slate-500 mt-1">Update login credentials and subscription plan.</p>
                            </div>
                            <Button variant="ghost" onClick={() => setEditing(null)}>✕</Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleUpdate} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Credentials */}
                                    <div className="col-span-2">
                                        <h3 className="font-semibold text-sm text-slate-700 mb-3 uppercase tracking-wider">Login Credentials</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm mb-1.5 block">Login Email</label>
                                                <Input required type="email" value={editing.email} onChange={e => setEditing({...editing, email: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="text-sm mb-1.5 block">Password</label>
                                                <Input required type="text" value={editing.password} onChange={e => setEditing({...editing, password: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="text-sm mb-1.5 block">Brand Name</label>
                                                <Input required value={editing.brand_name} onChange={e => setEditing({...editing, brand_name: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-2 border-t pt-4">
                                        <h3 className="font-semibold text-sm text-slate-700 mb-3 uppercase tracking-wider">Subscription & Billing</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm mb-1.5 block">Plan Status</label>
                                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                                    value={editing.plan_status} onChange={e => setEditing({...editing, plan_status: e.target.value})}>
                                                    <option value="trial">Trial</option>
                                                    <option value="active">Active</option>
                                                    <option value="trial_expired">Trial Expired</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-sm mb-1.5 block">Plan Tier</label>
                                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                                    value={editing.plan} onChange={e => setEditing({...editing, plan: e.target.value})}>
                                                    <option value="starter">Starter</option>
                                                    <option value="pro">Pro</option>
                                                    <option value="enterprise">Enterprise</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-sm mb-1.5 block">Monthly Cost (₹)</label>
                                                <Input type="number" required value={editing.monthly_amount} onChange={e => setEditing({...editing, monthly_amount: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="text-sm mb-1.5 block">Trial Ends At</label>
                                                <Input type="date" value={editing.trial_ends_at ? new Date(editing.trial_ends_at).toISOString().split('T')[0] : ''} onChange={e => setEditing({...editing, trial_ends_at: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
