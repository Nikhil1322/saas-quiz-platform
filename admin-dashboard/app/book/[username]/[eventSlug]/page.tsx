"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function PublicBookingPage() {
  const { username, eventSlug } = useParams() as { username: string; eventSlug: string };
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  const [bookingForm, setBookingForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [bookingStatus, setBookingStatus] = useState<"idle" | "booking" | "success" | "error">("idle");

  useEffect(() => {
    fetchEventDetails();
  }, [username, eventSlug]);

  const fetchEventDetails = async () => {
    const res = await fetch(`/api/admin/bookings/public/event-details?subdomain=${username}&eventSlug=${eventSlug}`);
    if (res.ok) {
      setEvent(await res.json());
    } else {
      setError("Event not found");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedDate && event) {
      fetchSlots();
    }
  }, [selectedDate, event]);

  const fetchSlots = async () => {
    setLoadingSlots(true);
    const res = await fetch(`/api/admin/bookings/public/slots?merchant_id=${event.merchant_id}&event_type_id=${event.event_type_id}&date=${selectedDate}`);
    if (res.ok) {
      setAvailableSlots(await res.json());
    }
    setLoadingSlots(false);
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingStatus("booking");
    const res = await fetch("/api/admin/bookings/public/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: event.merchant_id,
        event_type_id: event.event_type_id,
        ...bookingForm,
        date: selectedDate,
        time: selectedSlot,
      }),
    });

    if (res.ok) {
      setBookingStatus("success");
    } else {
      const data = await res.json();
      alert(data.msg || "Booking failed");
      setBookingStatus("error");
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400 animate-pulse">Loading...</div>;
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-red-400">{error}</div>;

  if (bookingStatus === "success") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner animate-bounce">
            ✅
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Booking Confirmed!</h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            Your appointment for <span className="font-bold text-gray-900">{event.title}</span> on <span className="font-bold text-gray-900">{selectedDate}</span> at <span className="font-bold text-gray-900">{selectedSlot}</span> has been successfully scheduled.
          </p>
          <p className="text-gray-400">A confirmation email has been sent to {bookingForm.email}.</p>
          <button 
             onClick={() => window.location.reload()}
             className="bg-indigo-600 text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition"
          >
             Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 lg:p-20">
      <div className="max-w-5xl mx-auto bg-white rounded-[40px] shadow-2xl shadow-indigo-100 overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Side: Info */}
        <div className="lg:w-1/3 p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-gray-100 space-y-8">
           <div className="space-y-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-3xl shadow-inner">⚡</div>
              <h1 className="text-3xl font-black text-gray-900 leading-tight tracking-tight">{event.title}</h1>
              <div className="flex items-center gap-3 text-gray-500 font-bold">
                 <span>🕒</span>
                 <span>{event.duration_mins} Minutes</span>
              </div>
              {event.price > 0 && (
                <div className="flex items-center gap-3 text-emerald-600 font-bold">
                   <span>💰</span>
                   <span>₹{event.price}</span>
                </div>
              )}
           </div>
           <p className="text-gray-500 leading-relaxed font-medium">
              {event.description || "Join us for this session. Please select a convenient time slot from the calendar."}
           </p>
           <div className="pt-8 border-t border-gray-50">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Hosted By</p>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {event.brand_name?.charAt(0) || "M"}
                 </div>
                 <span className="font-bold text-gray-900">{event.brand_name}</span>
              </div>
           </div>
        </div>

        {/* Right Side: Selection */}
        <div className="flex-1 p-10 lg:p-12">
          {!selectedDate ? (
            <div className="space-y-8 animate-in fade-in duration-500">
               <h2 className="text-2xl font-black text-gray-900">Select Date</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[...Array(14)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() + i);
                    const dateStr = d.toISOString().split('T')[0];
                    const isToday = i === 0;
                    
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`p-6 rounded-3xl border transition-all text-left group flex flex-col justify-between h-32 ${isToday ? "border-indigo-200 bg-indigo-50/30" : "border-gray-100 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-100"}`}
                      >
                         <span className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-indigo-400">
                           {d.toLocaleDateString('en-US', { weekday: 'short' })}
                         </span>
                         <span className="text-2xl font-black text-gray-900">
                           {d.getDate()} {d.toLocaleDateString('en-US', { month: 'short' })}
                         </span>
                      </button>
                    );
                  })}
               </div>
            </div>
          ) : !selectedSlot ? (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
               <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-900">Select Time</h2>
                  <button onClick={() => setSelectedDate("")} className="text-indigo-600 font-bold text-sm">← Back to dates</button>
               </div>
               <p className="text-gray-500 font-medium">Available slots for <span className="text-gray-900 font-black">{selectedDate}</span></p>
               
               {loadingSlots ? (
                  <div className="grid grid-cols-3 gap-3">
                    {[1,2,3,4,5,6].map(n => <div key={n} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />)}
                  </div>
               ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className="py-4 rounded-2xl border border-gray-100 text-sm font-black text-gray-900 hover:border-indigo-500 hover:bg-indigo-50 transition-all active:scale-95"
                      >
                        {slot.substring(0, 5)}
                      </button>
                    ))}
                  </div>
               ) : (
                  <div className="py-20 text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 rounded-3xl">
                     No slots available for this day.
                  </div>
               )}
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
               <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-900">Confirm Booking</h2>
                  <button onClick={() => setSelectedSlot("")} className="text-indigo-600 font-bold text-sm">← Back to times</button>
               </div>
               <div className="bg-indigo-600 text-white p-6 rounded-3xl flex items-center justify-between shadow-xl shadow-indigo-100">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Appointment Time</p>
                    <p className="text-xl font-black">{selectedDate} at {selectedSlot.substring(0,5)}</p>
                  </div>
                  <div className="text-3xl">📅</div>
               </div>

               <form onSubmit={handleBook} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                      <input
                        required
                        value={bookingForm.name}
                        onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                      <input
                        required
                        type="email"
                        value={bookingForm.email}
                        onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Phone Number (Optional)</label>
                      <input
                        value={bookingForm.phone}
                        onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                        placeholder="+91 9988776655"
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Additional Notes</label>
                      <textarea
                        value={bookingForm.notes}
                        onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold h-24"
                        placeholder="Anything else you'd like us to know?"
                      />
                  </div>
                  <button
                    type="submit"
                    disabled={bookingStatus === "booking"}
                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-black rounded-2xl shadow-2xl shadow-indigo-200 transition-all active:scale-[0.98] uppercase tracking-wider"
                  >
                    {bookingStatus === "booking" ? "Processing..." : "Confirm Appointment"}
                  </button>
               </form>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-center mt-12 text-gray-400 text-sm font-bold">Powered by Quiz CRM SaaS</p>
    </div>
  );
}
