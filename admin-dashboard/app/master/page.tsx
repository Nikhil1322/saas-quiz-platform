"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function MasterLogin() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/master/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem("master_token", data.token);
                localStorage.setItem("master_role", data.role);
                window.location.href = "/master/dashboard";
            } else {
                setError(data.msg || "Login failed");
            }
        } catch {
            setError("Server error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
                <CardHeader className="text-center space-y-2 pt-8">
                    <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-500/20">
                        <span className="text-white text-2xl">⚡</span>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white tracking-tight">Master SaaS Panel</CardTitle>
                    <CardDescription className="text-slate-400">
                        Superadmin access only
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2 text-left">
                                <Label htmlFor="username" className="text-slate-300">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="bg-slate-950 border-slate-800 text-white focus:border-blue-500 focus:ring-blue-500 h-11"
                                    required
                                />
                            </div>
                            <div className="space-y-2 text-left">
                                <Label htmlFor="password" className="text-slate-300">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-slate-950 border-slate-800 text-white focus:border-blue-500 focus:ring-blue-500 h-11"
                                    required
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-400 text-sm font-medium text-center">{error}</p>}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-11 shadow-lg shadow-blue-600/20"
                        >
                            {loading ? "Authenticating..." : "Login to Master Panel"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
