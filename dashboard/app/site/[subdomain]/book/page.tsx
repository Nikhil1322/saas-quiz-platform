"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";

export default function PublicBookingPage() {
    const params = useParams();
    const subdomain = params.subdomain as string;
    const [merchant, setMerchant] = useState<any>(null);
    
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [slots, setSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string>("");
    
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [notes, setNotes] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Find merchant by subdomain
        fetch(`/api/admin/bookings/public/merchant?subdomain=${subdomain}`)
            .then(res => res.json())
            .then(data => {
                if (data.id) {
                    setMerchant(data);
                    fetchSlots(data.id, new Date());
                }
            });
    }, [subdomain]);

    const fetchSlots = (merchantId: number, d: Date) => {
        // Add 1 day if timezone offsets it
        const dateStr = d.toLocaleDateString("en-CA"); // YYYY-MM-DD local format
        fetch(`/api/admin/bookings/public/availability/${merchantId}?date=${dateStr}`)
            .then(res => res.json())
            .then(data => {
                // Mock logic to generate slots (9:00, 9:30, etc.)
                const dummySlots = ["09:00:00", "09:30:00", "10:00:00", "14:00:00", "15:30:00"];
                setSlots(dummySlots);
            });
    };

    useEffect(() => {
        if (merchant && date) {
            fetchSlots(merchant.id, date);
            setSelectedSlot("");
        }
    }, [date]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const dateStr = date?.toLocaleDateString("en-CA");
        const res = await fetch("/api/admin/bookings/public/book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                merchant_id: merchant.id,
                name, email, phone, notes,
                date: dateStr,
                time: selectedSlot,
                duration: 30
            })
        });
        if (res.ok) setSuccess(true);
    };

    if (!merchant) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading booking page...</div>;

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center py-8 border-green-100 shadow-2xl">
                    <CardHeader>
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
                        <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
                        <CardDescription className="text-base mt-2">Your appointment has been scheduled for {date?.toLocaleDateString()} at {selectedSlot.substring(0, 5)}.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Book an Appointment</h1>
                    <p className="mt-4 text-lg text-gray-500">Schedule time with <span className="font-semibold text-gray-900">{merchant.brand_name || 'us'}</span></p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
                    <div className="p-8 md:w-1/2 bg-gray-50/50 border-r border-gray-100">
                        <h2 className="font-semibold text-lg mb-6">1. Select a Date & Time</h2>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="bg-white rounded-xl shadow-sm border mb-8 max-w-full flex justify-center"
                        />
                        {date && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Available Slots</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {slots.map(time => (
                                        <Button 
                                            key={time} 
                                            variant={selectedSlot === time ? "default" : "outline"}
                                            onClick={() => setSelectedSlot(time)}
                                            className={selectedSlot === time ? "bg-indigo-600 font-bold" : "hover:border-indigo-600 hover:text-indigo-600"}
                                        >
                                            {time.substring(0, 5)}
                                        </Button>
                                    ))}
                                    {slots.length === 0 && <p className="text-sm text-gray-500 col-span-3">No slots available on this date.</p>}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8 md:w-1/2">
                        <h2 className="font-semibold text-lg mb-6">2. Your Details</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" className="h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" className="h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone (optional)</Label>
                                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label>Notes (optional)</Label>
                                <textarea 
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]" 
                                    placeholder="Please share anything that will help prepare for our meeting."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>
                            <Button type="submit" disabled={!selectedSlot} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-semibold shadow-lg shadow-indigo-600/20 mt-4 transition-all">
                                Confirm Booking
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
