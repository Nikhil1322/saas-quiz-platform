"use client";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [availability, setAvailability] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        fetchProfile();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem("merchant_token");
        try {
            const res = await fetch("/api/admin/bookings", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setBookings(await res.json());
            
            const resAvail = await fetch("/api/admin/bookings/availability", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resAvail.ok) setAvailability(await resAvail.json());
        } catch (err) {
            console.error("Fetch data error:", err);
        }
        setLoading(false);
    };

    const fetchProfile = async () => {
        const token = localStorage.getItem("merchant_token");
        const res = await fetch("/api/admin/profile", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setProfile(await res.json());
    };

    const updateStatus = async (id: number, status: string) => {
        const token = localStorage.getItem("merchant_token");
        await fetch(`/api/admin/bookings/${id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status })
        });
        fetchData();
    };

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = profile?.subdomain ? `${origin}/book/${profile.subdomain}` : "";

    const dateFilteredBookings = bookings.filter(b => b.booking_date.startsWith(selectedDate));

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Appointments</h1>
                    <p className="text-gray-500 mt-1 font-medium">Manage your bookings, schedule, and availability.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData} className="rounded-xl font-bold">🔄 Refresh</Button>
                </div>
            </div>

            <Tabs defaultValue="calendar" className="w-full">
                <TabsList className="bg-gray-100 p-1 rounded-2xl mb-8">
                    <TabsTrigger value="calendar" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold transition-all">📅 Calendar View</TabsTrigger>
                    <TabsTrigger value="list" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold transition-all">📋 All Bookings</TabsTrigger>
                    <TabsTrigger value="availability" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold transition-all">⏰ Availability Rules</TabsTrigger>
                </TabsList>

                <TabsContent value="calendar" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Custom Styled Calendar */}
                        <Card className="lg:col-span-4 border-none shadow-2xl shadow-indigo-100 rounded-[40px] overflow-hidden">
                            <CardHeader className="bg-indigo-600 text-white pb-8">
                                <CardTitle className="text-xl">Select Date</CardTitle>
                                <CardDescription className="text-indigo-100 opacity-80">Choose a day to view its appointments.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <input 
                                        type="date" 
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full p-4 border-2 border-gray-100 rounded-2xl text-lg font-black text-gray-900 focus:border-indigo-500 transition-all outline-none bg-gray-50 focus:bg-white"
                                    />
                                    <div className="grid grid-cols-1 gap-2 pt-4">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Quick Selection</p>
                                        <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="w-full text-left p-3 hover:bg-indigo-50 rounded-xl text-sm font-bold transition-colors">Today</button>
                                        <button onClick={() => {
                                            const d = new Date();
                                            d.setDate(d.getDate() + 1);
                                            setSelectedDate(d.toISOString().split('T')[0]);
                                        }} className="w-full text-left p-3 hover:bg-indigo-50 rounded-xl text-sm font-bold transition-colors">Tomorrow</button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Appointments Detail */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-gray-900">
                                    Appointments for <span className="text-indigo-600">{new Date(selectedDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                </h2>
                                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none px-4 py-1.5 rounded-full font-black text-xs">
                                    {dateFilteredBookings.length} Bookings
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {dateFilteredBookings.map(b => (
                                    <div key={b.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-50 transition-colors">
                                                👤
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <p className="text-lg font-black text-gray-900">{b.customer_name}</p>
                                                    <Badge className={`${b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'} border-none px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider`}>
                                                        {b.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-gray-500">
                                                    <span className="flex items-center gap-1.5 font-bold text-indigo-600">🕒 {b.booking_time.substring(0,5)}</span>
                                                    <span>📧 {b.customer_email}</span>
                                                    <span>📞 {b.customer_phone}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {b.status === 'pending' && (
                                                <Button size="sm" onClick={() => updateStatus(b.id, 'confirmed')} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold px-6">Confirm</Button>
                                            )}
                                            {b.status !== 'cancelled' && (
                                                <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, 'cancelled')} className="rounded-xl border-gray-200 font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all">Cancel</Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {dateFilteredBookings.length === 0 && (
                                    <div className="py-20 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                                        <div className="text-4xl mb-4">📭</div>
                                        <h3 className="text-xl font-bold text-gray-900">No appointments for this date.</h3>
                                        <p className="text-gray-500 max-w-xs mx-auto mt-2">Any bookings made for this day will appear here automatically.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="list" className="space-y-6">
                    <Card className="mt-8 border-none shadow-2xl shadow-indigo-100 rounded-[40px] overflow-hidden bg-indigo-600 text-white">
                        <CardHeader className="p-8">
                            <CardTitle className="text-2xl font-black tracking-tight">Your Booking Portal</CardTitle>
                            <CardDescription className="text-indigo-100 font-medium opacity-80 text-base">Share your portal link or individual event links with customers.</CardDescription>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            {profile?.subdomain ? (
                                <div className="flex flex-col md:flex-row items-center gap-4 bg-indigo-500/30 p-4 rounded-3xl border border-indigo-400/30">
                                    <code className="flex-1 text-sm font-black tracking-tight truncate px-2">
                                        {origin}/book/{profile.subdomain}
                                    </code>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <Button 
                                            variant="secondary" 
                                            className="flex-1 md:flex-none bg-white text-indigo-600 hover:bg-indigo-50 rounded-2xl font-black text-xs uppercase px-6" 
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${origin}/book/${profile.subdomain}`);
                                                alert("✅ Link copied!");
                                            }}
                                        >
                                            Copy Link
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="flex-1 md:flex-none border-indigo-300 text-white hover:bg-indigo-500 rounded-2xl font-black text-xs uppercase px-6" 
                                            onClick={() => window.open(`${origin}/book/${profile.subdomain}`, '_blank')}
                                        >
                                            Visit ↗
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white/10 p-6 rounded-3xl border border-white/20 text-center">
                                    <p className="font-black uppercase tracking-widest text-xs mb-3">Subdomain Required</p>
                                    <a href="/dashboard/profile" className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all">
                                        Set your subdomain in Profile
                                    </a>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-2xl shadow-indigo-100 rounded-[40px] overflow-hidden">
                        <CardHeader className="p-10 border-b border-gray-50">
                            <CardTitle className="text-3xl font-black">All Bookings</CardTitle>
                            <CardDescription className="text-lg font-medium text-gray-400">A complete history of all customer appointments.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-50">
                                {bookings.map(b => (
                                    <div key={b.id} className="p-8 hover:bg-gray-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-xl">
                                                🗓️
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <p className="text-xl font-bold text-gray-900">{b.customer_name}</p>
                                                    <Badge className={`${b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'} border-none font-bold text-[10px] uppercase`}>{b.status}</Badge>
                                                </div>
                                                <p className="text-sm font-bold text-gray-400">
                                                    {new Date(b.booking_date).toLocaleDateString(undefined, { dateStyle: 'medium' })} at {b.booking_time.substring(0,5)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {b.status === 'pending' && <Button size="sm" onClick={() => updateStatus(b.id, 'confirmed')} className="bg-indigo-600 rounded-xl font-bold">Confirm</Button>}
                                            {b.status !== 'cancelled' && <Button size="sm" variant="ghost" onClick={() => updateStatus(b.id, 'cancelled')} className="text-red-500 hover:text-red-700 font-bold">Cancel</Button>}
                                        </div>
                                    </div>
                                ))}
                                {bookings.length === 0 && <p className="text-gray-500 py-20 text-center font-bold">No bookings found in history.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="availability" className="space-y-6">
                    <Card className="border-none shadow-2xl shadow-indigo-100 rounded-[40px] overflow-hidden">
                        <CardHeader className="p-10 border-b border-gray-50">
                            <CardTitle className="text-3xl font-black">Weekly Availability</CardTitle>
                            <CardDescription className="text-lg font-medium text-gray-400">Set your recurring weekly schedule for appointments.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-10 space-y-8">
                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    {id: 1, label: "Monday"}, {id: 2, label: "Tuesday"}, {id: 3, label: "Wednesday"},
                                    {id: 4, label: "Thursday"}, {id: 5, label: "Friday"}, {id: 6, label: "Saturday"}, {id: 0, label: "Sunday"}
                                ].map(day => {
                                    const rule = availability.find(r => r.day_of_week === day.id);
                                    const active = !!rule;
                                    return (
                                        <div key={day.id} className={`flex items-center gap-6 p-6 rounded-[28px] border-2 transition-all ${active ? 'bg-white border-indigo-100 shadow-lg shadow-indigo-50/50' : 'bg-gray-50 border-transparent opacity-50'}`}>
                                            <div className="flex items-center gap-4 w-48">
                                                <input 
                                                    type="checkbox" 
                                                    checked={active} 
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setAvailability([...availability, { day_of_week: day.id, start_time: "09:00", end_time: "17:00" }]);
                                                        } else {
                                                            setAvailability(availability.filter(r => r.day_of_week !== day.id));
                                                        }
                                                    }}
                                                    className="w-6 h-6 accent-indigo-600 rounded-lg cursor-pointer"
                                                />
                                                <span className="text-lg font-black text-gray-800">{day.label}</span>
                                            </div>
                                            
                                            {active ? (
                                                <div className="flex items-center gap-4 animate-in slide-in-from-left-4 duration-300">
                                                    <input 
                                                        type="time" 
                                                        value={rule.start_time.substring(0,5)} 
                                                        onChange={(e) => setAvailability(availability.map(r => r.day_of_week === day.id ? { ...r, start_time: e.target.value } : r))}
                                                        className="px-5 py-3 rounded-2xl border-2 border-gray-100 text-sm font-black focus:border-indigo-500 outline-none transition-all"
                                                    />
                                                    <span className="text-gray-300 font-black tracking-widest text-xs uppercase">to</span>
                                                    <input 
                                                        type="time" 
                                                        value={rule.end_time.substring(0,5)} 
                                                        onChange={(e) => setAvailability(availability.map(r => r.day_of_week === day.id ? { ...r, end_time: e.target.value } : r))}
                                                        className="px-5 py-3 rounded-2xl border-2 border-gray-100 text-sm font-black focus:border-indigo-500 outline-none transition-all"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-sm font-bold text-gray-400 italic">Not available today</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="pt-6 flex justify-end gap-4">
                                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 px-12 py-7 text-lg rounded-3xl shadow-2xl shadow-indigo-200 transition-all active:scale-95 font-black uppercase tracking-widest" onClick={async () => {
                                    const token = localStorage.getItem("merchant_token");
                                    const res = await fetch("/api/admin/bookings/availability", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                        body: JSON.stringify(availability)
                                    });
                                    if(res.ok) alert("✅ Schedule updated successfully!");
                                }}>Update Schedule ✨</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
