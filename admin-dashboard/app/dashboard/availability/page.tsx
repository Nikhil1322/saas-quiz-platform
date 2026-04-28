"use client";
import { useState, useEffect } from "react";

type DayAvailability = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    const token = localStorage.getItem("merchant_token");
    const res = await fetch("/api/admin/bookings/availability", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setAvailability(await res.json());
    setLoading(false);
  };

  const handleToggleDay = (dayIndex: number) => {
    const exists = availability.find((a) => a.day_of_week === dayIndex);
    if (exists) {
      setAvailability(availability.filter((a) => a.day_of_week !== dayIndex));
    } else {
      setAvailability([...availability, { day_of_week: dayIndex, start_time: "09:00", end_time: "17:00" }]);
    }
  };

  const handleChangeTime = (dayIndex: number, field: "start_time" | "end_time", value: string) => {
    setAvailability(
      availability.map((a) => (a.day_of_week === dayIndex ? { ...a, [field]: value } : a))
    );
  };

  const saveAvailability = async () => {
    setSaving(true);
    const token = localStorage.getItem("merchant_token");
    const res = await fetch("/api/admin/bookings/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(availability),
    });
    if (res.ok) alert("Availability saved!");
    setSaving(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Availability</h1>
          <p className="text-gray-500 mt-1">Set your weekly recurring schedule for bookings.</p>
        </div>
        <button
          onClick={saveAvailability}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
        >
          {saving ? "Saving..." : "Save Schedule"}
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-[40px] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {DAYS.map((day, index) => {
              const schedule = availability.find((a) => a.day_of_week === index);
              const isActive = !!schedule;

              return (
                <div key={day} className={`p-6 flex flex-col md:flex-row md:items-center gap-6 transition-colors ${isActive ? "bg-white" : "bg-gray-50/50"}`}>
                  <div className="flex items-center gap-4 w-48">
                    <button
                      onClick={() => handleToggleDay(index)}
                      className={`w-12 h-6 rounded-full transition-all relative ${isActive ? "bg-indigo-600" : "bg-gray-300"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isActive ? "left-7" : "left-1"}`} />
                    </button>
                    <span className={`font-bold text-sm ${isActive ? "text-gray-900" : "text-gray-400"}`}>{day}</span>
                  </div>

                  {isActive ? (
                    <div className="flex items-center gap-3 animate-in slide-in-from-left-2 duration-200">
                      <div className="relative">
                         <input
                           type="time"
                           value={schedule.start_time.substring(0, 5)}
                           onChange={(e) => handleChangeTime(index, "start_time", e.target.value)}
                           className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                         />
                      </div>
                      <span className="text-gray-400 font-bold">to</span>
                      <div className="relative">
                         <input
                           type="time"
                           value={schedule.end_time.substring(0, 5)}
                           onChange={(e) => handleChangeTime(index, "end_time", e.target.value)}
                           className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                         />
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm italic">Unavailable</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4 items-start">
         <div className="text-xl">💡</div>
         <div className="text-sm text-amber-800 leading-relaxed">
            <p className="font-bold mb-1">Timezone Notice</p>
            Your availability is stored in UTC. All bookings will be automatically adjusted to your customer's local timezone.
         </div>
      </div>
    </div>
  );
}
