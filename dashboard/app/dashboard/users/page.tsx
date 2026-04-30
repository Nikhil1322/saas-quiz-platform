"use client";
import { useEffect, useState } from "react";

type StaffUser = { id: number; username: string; role: string; created_at: string; };

export default function UsersPage() {
    const [users, setUsers] = useState<StaffUser[]>([]);
    const [inviteLink, setInviteLink] = useState("");
    const [copied, setCopied] = useState(false);
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(true);
    const [inviteRole, setInviteRole] = useState("staff_viewer");

    useEffect(() => {
        const t = localStorage.getItem("merchant_token") || "";
        const r = localStorage.getItem("role") || "";
        setToken(t);
        if (!t || r !== "master") { window.location.href = "/dashboard"; return; }
        loadUsers(t);
    }, []);

    const loadUsers = (t: string) => {
        setLoading(true);
        fetch("/api/admin/users", { headers: { Authorization: `Bearer ${t}` } })
            .then(r => r.json())
            .then(d => { setUsers(Array.isArray(d) ? d : []); setLoading(false); });
    };

    const generateInvite = async () => {
        const res = await fetch("/api/admin/invite", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ role: inviteRole })
        });
        const data = await res.json();
        if (data.token) {
            // Use current origin so it works on ngrok, localhost, or any domain
            setInviteLink(`${window.location.origin}/invite?token=${data.token}`);
        } else if (data.link) {
            // Fallback: fix any localhost in the link to current origin
            const fixedLink = data.link.replace(/https?:\/\/localhost:\d+/, window.location.origin);
            setInviteLink(fixedLink);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const deleteUser = async (id: number) => {
        if (!confirm("Remove this user's access?")) return;
        await fetch(`/api/admin/users/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        loadUsers(token);
    };

    const masters = users.filter(u => u.role === "master");
    const staff = users.filter(u => u.role.startsWith("staff") || u.role === "staff");

    return (
        <div className="p-6 space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">👥 Users</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Manage dashboard access for your team</p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value)}
                        className="border border-gray-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    >
                        <option value="staff_admin">Admin</option>
                        <option value="staff_editor">Editor</option>
                        <option value="staff_viewer">Viewer</option>
                    </select>
                    <button
                        onClick={generateInvite}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-md shadow-indigo-200"
                    >
                        + Generate Invite Link
                    </button>
                </div>
            </div>

            {/* Invite Link Card */}
            {inviteLink && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                            <span className="text-white text-lg">📨</span>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-indigo-900">Staff Invite Link Generated</p>
                            <p className="text-sm text-indigo-700 mt-0.5 mb-3">
                                Share this link with your staff — it can only be used once.
                                Send via WhatsApp or email.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    readOnly value={inviteLink}
                                    className="flex-1 bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs text-gray-600 focus:outline-none"
                                />
                                <button
                                    onClick={copyLink}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${copied ? "bg-green-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                                >
                                    {copied ? "✓ Copied!" : "Copy"}
                                </button>
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(`You've been invited to join the Quiz CRM dashboard. Click to set up your account: ${inviteLink}`)}`}
                                    target="_blank"
                                    className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
                                >
                                    📱 WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Masters */}
            <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Master Admins</h2>
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                {["User", "Role", "Joined", ""].map(h => (
                                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {masters.map(u => (
                                <tr key={u.id} className="border-t">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <span className="text-indigo-700 font-bold text-sm">{u.username.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <span className="font-medium text-gray-900">{u.username}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-semibold">👑 Master</span>
                                    </td>
                                    <td className="px-5 py-4 text-gray-500 text-xs">
                                        {u.created_at ? new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                    </td>
                                    <td className="px-5 py-4 text-gray-400 text-xs">Owner</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Staff */}
            <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Staff Members <span className="text-gray-400 font-normal">({staff.length})</span>
                </h2>
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                {["User", "Role", "Joined", "Action"].map(h => (
                                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map(u => (
                                <tr key={u.id} className="border-t hover:bg-gray-50 transition">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                                                <span className="text-gray-600 font-bold text-sm">{u.username.charAt(0).toUpperCase()}</span>
                                            </div>
                                        <span className="font-medium text-gray-900">{u.username}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                        u.role === 'staff_admin' ? 'bg-purple-100 text-purple-700' :
                                        u.role === 'staff_editor' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {u.role === 'staff_admin' ? '🛡️ Admin' : u.role === 'staff_editor' ? '📝 Editor' : '👀 Viewer'}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-gray-500 text-xs">
                                        {u.created_at ? new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                    </td>
                                    <td className="px-5 py-4">
                                        <button
                                            onClick={() => deleteUser(u.id)}
                                            className="text-red-500 hover:text-red-700 text-xs font-semibold transition"
                                        >
                                            Remove Access
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {staff.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-10 text-center text-gray-400">
                                        <p className="text-2xl mb-2">👋</p>
                                        <p className="text-sm">No staff members yet.</p>
                                        <p className="text-xs mt-1">Generate an invite link above to add your first staff member.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
