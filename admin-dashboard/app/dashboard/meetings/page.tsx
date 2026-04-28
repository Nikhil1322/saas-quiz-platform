"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Meeting = {
  id: number;
  title: string;
  room_name: string;
  room_url: string;
  created_at: string;
  start_time: string | null;
  recording_url?: string;
  transcript?: string;
};

export default function MeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  const fetchMeetings = async () => {
    const token = localStorage.getItem("merchant_token");
    const res = await fetch("/api/admin/meetings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setMeetings(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const startMeeting = async () => {
    setCreating(true);
    const token = localStorage.getItem("merchant_token");
    try {
      const res = await fetch("/api/admin/meetings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim() || "Instant Meeting" }),
      });
      const data = await res.json();
      if (data.success) router.push(`/dashboard/meetings/${data.id}`);
    } finally {
      setCreating(false);
    }
  };

  const deleteMeeting = async (id: number) => {
    if (!confirm("Delete this meeting room?")) return;
    const token = localStorage.getItem("merchant_token");
    await fetch(`/api/admin/meetings/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchMeetings();
  };

  const copyLink = (m: Meeting) => {
    navigator.clipboard.writeText(`${window.location.origin}/meet/${m.room_name}`);
    setCopied(m.id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-8 space-y-10 bg-gray-50/50 min-h-screen">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Video Meetings</h1>
          <p className="text-gray-500 font-medium mt-1">
            Host peer-to-peer video calls — no third-party tools needed.
          </p>
        </div>

        {/* Quick-create */}
        <div className="flex items-center gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && startMeeting()}
            placeholder="Meeting title (optional)"
            className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium text-gray-700 w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
          <button
            onClick={startMeeting}
            disabled={creating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-3 rounded-2xl transition-all shadow-xl shadow-indigo-200 disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
          >
            {creating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              "📹 Start New Meeting"
            )}
          </button>
        </div>
      </div>

      {/* ── Info Banner ── */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-xl shadow-indigo-200/40">
        <div className="text-5xl">🔒</div>
        <div className="text-white space-y-1 flex-1">
          <h3 className="font-black text-lg">100% Private · Self-Hosted WebRTC</h3>
          <p className="text-indigo-200 text-sm font-medium">
            Video and audio run peer-to-peer directly between participants. No data passes through
            any third-party server. All calls are end-to-end encrypted via DTLS/SRTP.
          </p>
        </div>
        <div className="flex gap-6 shrink-0 text-center text-white">
          {[
            ["🎥", "HD Video"],
            ["🎙️", "Clear Audio"],
            ["🖥️", "Screen Share"],
            ["💬", "In-Call Chat"],
          ].map(([icon, label]) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-2xl">{icon}</span>
              <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider whitespace-nowrap">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="py-24 text-center text-gray-400 animate-pulse font-bold">
          Loading meetings...
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl py-24 text-center space-y-4">
          <div className="text-6xl">📹</div>
          <h3 className="text-xl font-black text-gray-800">No meetings yet</h3>
          <p className="text-gray-400 font-medium">
            Create your first room above and share the link with your client.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {meetings.map((m) => (
            <MeetingCard
              key={m.id}
              meeting={m}
              copied={copied === m.id}
              onCopy={() => copyLink(m)}
              onJoin={() => router.push(`/dashboard/meetings/${m.id}`)}
              onDelete={() => deleteMeeting(m.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MeetingCard({
  meeting,
  copied,
  onCopy,
  onJoin,
  onDelete,
}: {
  meeting: Meeting;
  copied: boolean;
  onCopy: () => void;
  onJoin: () => void;
  onDelete: () => void;
}) {
  const [showTranscript, setShowTranscript] = useState(false);

  const dateStr = meeting.start_time
    ? new Date(meeting.start_time).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : `Created ${new Date(meeting.created_at).toLocaleDateString(undefined, {
        dateStyle: "medium",
      })}`;

  return (
    <>
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl hover:shadow-2xl transition-all p-6 flex flex-col gap-5 group">
      {/* Top row */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-2xl shadow-lg shadow-indigo-200 shrink-0">
          📹
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-gray-900 text-lg leading-tight truncate">
            {meeting.title}
          </h3>
          <p className="text-xs text-gray-400 font-bold mt-1">{dateStr}</p>
        </div>
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1.5 shadow-md shadow-emerald-300 animate-pulse" />
      </div>

      {/* Room chip */}
      <div className="bg-gray-50 rounded-2xl px-4 py-2.5 flex items-center gap-2 border border-gray-100">
        <span className="text-xs text-gray-400 font-bold shrink-0">Room:</span>
        <code className="text-xs text-indigo-600 font-black truncate">{meeting.room_name}</code>
      </div>

      {/* Primary actions */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onJoin}
          className="col-span-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-200 hover:shadow-xl active:scale-95"
        >
          🎥 Join as Host
        </button>
        <button
          onClick={onCopy}
          className={`py-3 rounded-2xl font-black text-sm transition-all border active:scale-95 ${
            copied
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
          }`}
          title="Copy invite link"
        >
          {copied ? "✓" : "🔗"}
        </button>
      </div>

      {/* Danger */}
      <button
        onClick={onDelete}
        className="py-2.5 rounded-2xl font-bold text-xs text-red-400 hover:text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
      >
        🗑 End &amp; Delete Room
      </button>

      {/* History Links */}
      {(meeting.recording_url || meeting.transcript) && (
        <div className="pt-4 border-t border-gray-100 mt-2 space-y-2">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">History & Media</p>
          <div className="flex flex-col gap-2">
            {meeting.recording_url && (
              <a href={meeting.recording_url.startsWith('http') ? meeting.recording_url : `http://localhost:5000${meeting.recording_url}`} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 font-bold hover:underline bg-indigo-50 px-3 py-2 rounded-xl">
                <span>🎥</span> Download Recording
              </a>
            )}
            {meeting.transcript && (
              <button onClick={() => setShowTranscript(true)} className="flex items-center gap-2 text-sm text-emerald-600 font-bold hover:underline bg-emerald-50 px-3 py-2 rounded-xl text-left">
                <span>📝</span> View Transcript
              </button>
            )}
          </div>
        </div>
      )}
    </div>

    {/* Transcript Modal */}
    {showTranscript && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-black text-gray-900 text-lg">Meeting Transcript</h3>
            <button onClick={() => setShowTranscript(false)} className="text-gray-400 hover:text-gray-600 text-xl font-black">✕</button>
          </div>
          <div className="p-6 overflow-y-auto whitespace-pre-wrap font-medium text-sm text-gray-700 leading-relaxed bg-white">
            {meeting.transcript}
          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
             <button onClick={() => {
                navigator.clipboard.writeText(meeting.transcript!);
                alert("Transcript copied!");
             }} className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-black rounded-xl transition">Copy Text</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
