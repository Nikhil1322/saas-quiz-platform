"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

const SIGNAL_URL = process.env.NEXT_PUBLIC_SIGNAL_URL || "http://localhost:5000";
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type Peer = { socketId: string; name: string; stream?: MediaStream };
type ChatMsg = { name: string; message: string; time: string; self?: boolean };
type TranscriptMsg = { name: string; text: string; time: string };

export default function HostMeetingRoom() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [meeting, setMeeting] = useState<any>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [sideInvite, setSideInvite] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatLog, setChatLog] = useState<ChatMsg[]>([]);
  const [unread, setUnread] = useState(0);
  const [inviteEmail, setInviteEmail] = useState("");
  const [copied, setCopied] = useState(false);

  // Recording & Transcription
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transcriptLog, setTranscriptLog] = useState<TranscriptMsg[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const localRef = useRef<HTMLVideoElement>(null);
  const localStream = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
  // Guard against React Strict Mode double-start
  const startedRef = useRef(false);

  // ── Load meeting data ──────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("merchant_token");
    if (!token) { router.push("/"); return; }
    fetch(`/api/admin/meetings`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const m = data.find((x: any) => x.id === parseInt(id));
        if (m) setMeeting(m);
      });
  }, [id, router]);

  // ── WebRTC helpers ─────────────────────────────────────────
  const createPC = useCallback((socketId: string, peerName: string, isInitiator: boolean) => {
    if (pcsRef.current[socketId]) return pcsRef.current[socketId];
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcsRef.current[socketId] = pc;

    localStream.current?.getTracks().forEach((t) => pc.addTrack(t, localStream.current!));

    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          to: socketId, from: socketRef.current.id, candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      setPeers((prev) => {
        const exists = prev.find((p) => p.socketId === socketId);
        if (exists) return prev.map((p) => p.socketId === socketId ? { ...p, stream } : p);
        return [...prev, { socketId, name: peerName, stream }];
      });
    };

    if (isInitiator) {
      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer);
        socketRef.current?.emit("offer", {
          to: socketId, from: socketRef.current!.id, offer, name: "Host",
        });
      });
    }
    return pc;
  }, []);

  // ── Start meeting once meeting is loaded ───────────────────
  useEffect(() => {
    if (!meeting || startedRef.current) return;
    startedRef.current = true;

    (async () => {
      const stream = await navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .catch(() => null);
      localStream.current = stream;
      if (localRef.current && stream) localRef.current.srcObject = stream;

      const socket = io(SIGNAL_URL, { transports: ["websocket"] });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join-room", { roomName: meeting.room_name, peerId: socket.id, name: "Host" });
      });

      socket.on("room-users", (users: { socketId: string; name: string }[]) => {
        users.forEach((u) => createPC(u.socketId, u.name, true));
        setPeers((prev) => {
          const existing = new Set(prev.map((p) => p.socketId));
          const fresh = users
            .filter((u) => !existing.has(u.socketId))
            .map((u) => ({ socketId: u.socketId, name: u.name }));
          return [...prev, ...fresh];
        });
      });

      socket.on("user-joined", ({ socketId, name: peerName }: { socketId: string; name: string }) => {
        createPC(socketId, peerName, false);
        setPeers((prev) =>
          prev.find((p) => p.socketId === socketId) ? prev : [...prev, { socketId, name: peerName }]
        );
      });

      socket.on("offer", async ({ from, offer, name: peerName }: any) => {
        const pc = pcsRef.current[from] || createPC(from, peerName, false);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { to: from, from: socket.id, answer });
      });

      socket.on("answer", async ({ from, answer }: any) => {
        await pcsRef.current[from]?.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on("ice-candidate", async ({ from, candidate }: any) => {
        try { await pcsRef.current[from]?.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      });

      socket.on("user-left", ({ socketId }: { socketId: string }) => {
        pcsRef.current[socketId]?.close();
        delete pcsRef.current[socketId];
        setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
      });

      // Chat from OTHERS only (own messages added locally)
      socket.on("chat-message", (msg: ChatMsg) => {
        setChatLog((prev) => [...prev, msg]);
        setChatOpen((open) => { if (!open) setUnread((u) => u + 1); return open; });
      });

      // Transcript incoming from anyone
      socket.on("transcript", (msg: TranscriptMsg) => {
        setTranscriptLog((prev) => [...prev, msg]);
      });

      // Local Speech Recognition (Transcribing the Host)
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = false;
        rec.onresult = (e: any) => {
          const text = e.results[e.results.length - 1][0].transcript;
          if (text.trim() && socketRef.current) {
            socketRef.current.emit("transcript", { roomName: meeting.room_name, name: "Host", text });
          }
        };
        try { rec.start(); } catch (err) {}
        rec.onend = () => { try { rec.start(); } catch (err) {} };
      }
    })();

    return () => {
      // Only runs on true unmount
      localStream.current?.getTracks().forEach((t) => t.stop());
      socketRef.current?.disconnect();
      Object.values(pcsRef.current).forEach((pc) => pc.close());
    };
  }, [meeting, createPC]);

  // ── Recording ──────────────────────────────────────────────
  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: "browser" },
          audio: true,
          preferCurrentTab: true,
        } as any);
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        recordedChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          setIsRecording(false);
          stream.getTracks().forEach((t) => t.stop());
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch (err: any) {
        console.error("Failed to start recording", err);
        if (err.name !== "NotAllowedError") {
          alert("Failed to start recording. Please ensure you allow screen sharing.");
        }
        setIsRecording(false);
      }
    }
  };

  const leaveAndSaveMeeting = async () => {
    if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsSaving(true);
    
    // Wait briefly for recorder to finish chunking
    await new Promise((r) => setTimeout(r, 1000));

    try {
      const token = localStorage.getItem("merchant_token");
      const formData = new FormData();

      let hasData = false;
      if (recordedChunksRef.current.length > 0) {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        formData.append("video", blob, "meeting.webm");
        hasData = true;
      }
      if (transcriptLog.length > 0) {
        const text = transcriptLog.map((t) => `[${t.time}] ${t.name}: ${t.text}`).join("\n");
        formData.append("transcript", text);
        hasData = true;
      }

      if (hasData) {
        await fetch(`/api/admin/meetings/${meeting.id}/recording`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }
    } catch (err) {
      console.error("Error saving meeting history", err);
    }

    localStream.current?.getTracks().forEach((t) => t.stop());
    socketRef.current?.disconnect();
    Object.values(pcsRef.current).forEach((pc) => pc.close());
    router.push("/dashboard/meetings");
  };

  // ── Controls ──────────────────────────────────────────────
  const toggleMic = () => {
    localStream.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setMicOn((v) => !v);
  };
  const toggleCam = () => {
    localStream.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setCamOn((v) => !v);
  };

  const toggleScreen = async () => {
    if (!screenSharing) {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true }).catch(() => null);
      if (!screen) return;
      const track = screen.getVideoTracks()[0];
      Object.values(pcsRef.current).forEach((pc) =>
        pc.getSenders().find((s) => s.track?.kind === "video")?.replaceTrack(track)
      );
      if (localRef.current) localRef.current.srcObject = screen;
      track.onended = stopScreen;
      setScreenSharing(true);
    } else stopScreen();
  };

  const stopScreen = () => {
    const cam = localStream.current?.getVideoTracks()[0];
    if (cam) Object.values(pcsRef.current).forEach((pc) =>
      pc.getSenders().find((s) => s.track?.kind === "video")?.replaceTrack(cam)
    );
    if (localRef.current) localRef.current.srcObject = localStream.current;
    setScreenSharing(false);
  };

  const sendChat = () => {
    const msg = chatMsg.trim();
    if (!msg || !socketRef.current || !meeting) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    // Add locally — server only echoes to others
    setChatLog((prev) => [...prev, { name: "Host", message: msg, time, self: true }]);
    socketRef.current.emit("chat-message", { roomName: meeting.room_name, name: "Host", message: msg });
    setChatMsg("");
  };

  const copyLink = () => {
    if (!meeting) return;
    navigator.clipboard.writeText(`${window.location.origin}/meet/${meeting.room_name}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !meeting) return;
    const token = localStorage.getItem("merchant_token");
    const link = `${window.location.origin}/meet/${meeting.room_name}`;
    await fetch(`/api/admin/meetings/${meeting.id}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: inviteEmail, link }),
    });
    setInviteEmail("");
    alert("✅ Invite sent!");
  };

  if (isSaving) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white space-y-4">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <h2 className="text-xl font-bold">Saving Meeting History...</h2>
      <p className="text-gray-400">Uploading recording and transcript...</p>
    </div>
  );

  if (!meeting) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white animate-pulse">
      Setting up room...
    </div>
  );

  const count = 1 + peers.length;
  const gridClass =
    count === 1 ? "grid-cols-1" :
    count === 2 ? "grid-cols-2" :
    count <= 4  ? "grid-cols-2" : "grid-cols-3";

  return (
    <div className="w-screen h-screen bg-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900/80 backdrop-blur border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-white font-black">{meeting.title}</span>
          <span className="bg-indigo-900/60 text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Host</span>
          <span className="text-gray-500 text-xs font-bold">· {count} participant{count !== 1 ? "s" : ""}</span>
          {isRecording && (
            <span className="flex items-center gap-1.5 ml-4 text-xs font-bold text-red-500 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              Recording...
            </span>
          )}
        </div>
        <span className="text-gray-500 text-xs font-mono">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Video Grid */}
        <div className={`flex-1 grid ${gridClass} gap-2 p-2 overflow-hidden`}>
          <VideoTile name="You (Host)" isLocal localRef={localRef} />
          {peers.map((p) => (
            <VideoTile key={p.socketId} name={p.name} stream={p.stream} />
          ))}
        </div>

        {/* Chat Panel */}
        {chatOpen && (
          <ChatPanel
            log={chatLog}
            value={chatMsg}
            onChange={setChatMsg}
            onSend={sendChat}
            onClose={() => setChatOpen(false)}
          />
        )}

        {/* Invite Panel */}
        {sideInvite && !chatOpen && (
          <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0">
            <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-black text-white text-sm">Invite</h3>
              <button onClick={() => setSideInvite(false)} className="text-gray-500 hover:text-white transition text-lg leading-none">✕</button>
            </div>
            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Meeting Link</label>
                <div className="flex gap-2">
                  <code className="flex-1 bg-gray-800 text-indigo-300 px-3 py-2.5 rounded-xl text-xs break-all border border-gray-700">
                    {typeof window !== "undefined" ? `${window.location.origin}/meet/${meeting.room_name}` : ""}
                  </code>
                  <button
                    onClick={copyLink}
                    className={`px-3 py-2 rounded-xl font-black text-xs transition shrink-0 ${copied ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                  >
                    {copied ? "✓" : "Copy"}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Invite via Email</label>
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                />
                <button
                  onClick={sendInvite}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-sm transition"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="shrink-0 bg-gray-900/90 backdrop-blur border-t border-gray-800 px-6 py-4 flex items-center justify-center gap-3">
        <Btn label={micOn ? "Mute" : "Unmute"} icon={micOn ? "🎙️" : "🔇"} onClick={toggleMic} danger={!micOn} />
        <Btn label={camOn ? "Stop Video" : "Start Video"} icon="📷" onClick={toggleCam} danger={!camOn} />
        <Btn label={screenSharing ? "Stop Share" : "Share Screen"} icon="🖥️" onClick={toggleScreen} active={screenSharing} />
        <Btn label={isRecording ? "Stop Rec" : "Record"} icon="⏺️" onClick={toggleRecording} danger={isRecording} active={isRecording} />
        
        <button
          onClick={() => { setChatOpen((v) => { const next = !v; if (next) { setUnread(0); setSideInvite(false); } return next; }); }}
          className={`relative flex flex-col items-center gap-1 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${chatOpen ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
        >
          💬 Chat
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>
        <button
          onClick={() => { setSideInvite((v) => { if (!v) setChatOpen(false); return !v; }); }}
          className={`flex flex-col items-center gap-1 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${sideInvite ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
        >
          🔗 Invite
        </button>
        <button
          onClick={leaveAndSaveMeeting}
          className="flex flex-col items-center gap-1 px-8 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition-all"
        >
          📵 End & Save
        </button>
      </div>
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────

function VideoTile({ name, stream, isLocal, localRef }: {
  name: string; stream?: MediaStream | null; isLocal?: boolean;
  localRef?: React.RefObject<HTMLVideoElement>;
}) {
  const remoteRef = useRef<HTMLVideoElement>(null);
  const ref = localRef ?? remoteRef;

  useEffect(() => {
    if (!isLocal && ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream, isLocal, ref]);

  return (
    <div className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 flex items-center justify-center min-h-0">
      <video ref={ref} autoPlay playsInline muted={isLocal} className="w-full h-full object-cover" />
      {!stream && !isLocal && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-indigo-900 flex items-center justify-center text-2xl font-black text-indigo-400">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur rounded-xl px-2.5 py-1">
        <span className="text-white text-xs font-bold">{name}</span>
      </div>
    </div>
  );
}

function ChatPanel({ log, value, onChange, onSend, onClose }: {
  log: ChatMsg[]; value: string;
  onChange: (v: string) => void; onSend: () => void; onClose: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [log]);

  return (
    <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0">
      <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
        <h3 className="font-black text-white text-sm">Chat</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition text-lg leading-none">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {log.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.self ? "items-end" : "items-start"}`}>
            <div className="flex items-baseline gap-1.5 mb-0.5">
              <span className="text-[11px] font-black text-indigo-400">{m.name}</span>
              <span className="text-[10px] text-gray-600">{m.time}</span>
            </div>
            <p className={`text-sm rounded-2xl px-3 py-2 max-w-[90%] break-words ${m.self ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-gray-800 text-gray-100 rounded-tl-sm"}`}>
              {m.message}
            </p>
          </div>
        ))}
        {log.length === 0 && <p className="text-gray-600 text-xs text-center py-8">No messages yet 💬</p>}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-gray-800 flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="Type a message..."
          className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600 min-w-0"
        />
        <button onClick={onSend} className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black transition shrink-0">↑</button>
      </div>
    </div>
  );
}

function Btn({ label, icon, onClick, danger, active }: {
  label: string; icon: string; onClick: () => void; danger?: boolean; active?: boolean;
}) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl text-xs font-black transition-all
      ${danger ? "bg-red-900/50 text-red-400 hover:bg-red-900" : active ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}
