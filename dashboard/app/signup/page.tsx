"use client";
import { useState } from "react";

export default function Signup() {
    const [user, setUser] = useState("");
    const [pass, setPass] = useState("");

    const signup = async () => {
        await fetch("/api/admin/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass })
        });
        alert("Created");
        window.location.href = "/";
    };

    return (
        <div className="h-screen flex items-center justify-center">
            <div className="bg-white p-6 shadow w-80">
                <input onChange={e => setUser(e.target.value)} placeholder="Username" className="border p-2 w-full mb-3" />
                <input onChange={e => setPass(e.target.value)} type="password" placeholder="Password" className="border p-2 w-full mb-3" />
                <button onClick={signup} className="bg-green-600 text-white w-full p-2">Signup</button>
            </div>
        </div>
    );
}
