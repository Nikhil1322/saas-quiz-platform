"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
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

export default function GuestMeetingRoom() {
  const { roomName } = useParams() as { roomName: string };
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [error, setError] = useState(false);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatLog, setChatLog] = useState<ChatMsg[]>([]);
  const [unread, setUnread] = useState(0);

  const localRef = useRef<HTMLVideoElement>(null);
  const localStream = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const nameRef = useRef("");
  // Guard against React Strict Mode double-invocation
  const joinedRef = useRef(false);

  useEffect(() => {
    fetch(`/api/admin/meetings/public/${roomName}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setRoomInfo)
      .catch(() => setError(true));
  }, [roomName]);

  const createPC = useCallback(
    (socketId: string, peerName: string, isInitiator: boolean) => {
      // Don't duplicate
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
            to: socketId, from: socketRef.current!.id, offer, name: nameRef.current,
          });
        });
      }
      return pc;
    },
    []
  );

  const joinRoom = useCallback(async () => {
    if (joinedRef.current) return; // prevent double-join
    joinedRef.current = true;
    nameRef.current = name;

    const stream = await navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .catch(() => null);
    localStream.current = stream;
    if (localRef.current && stream) localRef.current.srcObject = stream;

    const socket = io(SIGNAL_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", { roomName, peerId: socket.id, name });
    });

    socket.on("room-users", (users: { socketId: string; name: string }[]) => {
      users.forEach((u) => createPC(u.socketId, u.name, true));
      setPeers((prev) => {
        const existing = new Set(prev.map((p) => p.socketId));
        const fresh = users.filter((u) => !existing.has(u.socketId)).map((u) => ({ socketId: u.socketId, name: u.name }));
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
      let pc = pcsRef.current[from] || createPC(from, peerName, false);
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

    // Chat from OTHERS (own messages added locally on send)
    socket.on("chat-message", (msg: ChatMsg) => {
      setChatLog((prev) => [...prev, msg]);
      setChatOpen((open) => { if (!open) setUnread((u) => u + 1); return open; });
    });

    setJoined(true);

    // Setup Speech Recognition
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = false;
      rec.onresult = (e: any) => {
        const text = e.results[e.results.length - 1][0].transcript;
        if (text.trim() && socketRef.current) {
          socketRef.current.emit("transcript", { roomName, name: nameRef.current, text });
        }
      };
      try { rec.start(); } catch(err) {}
      rec.onend = () => { try { rec.start(); } catch(err) {} };
    }
  }, [name, roomName, createPC]);

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
    if (!msg || !socketRef.current) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    // Add locally immediately (server only echoes to others)
    setChatLog((prev) => [...prev, { name: nameRef.current, message: msg, time, self: true }]);
    socketRef.current.emit("chat-message", { roomName, name: nameRef.current, message: msg });
    setChatMsg("");
  };

  const leaveRoom = () => {
    localStream.current?.getTracks().forEach((t) => t.stop());
    socketRef.current?.disconnect();
    Object.values(pcsRef.current).forEach((pc) => pc.close());
    window.location.href = "/";
  };

  // ── Screens ──────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      <div className="text-center space-y-4">
        <div className="text-6xl">🚫</div>
        <h2 className="text-2xl font-bold">Meeting Not Found</h2>
        <p className="text-gray-400">This link is invalid or the room has been closed.</p>
      </div>
    </div>
  );

  if (!roomInfo) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white animate-pulse">
      Loading meeting...
    </div>
  );

  if (!joined) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-xl shadow-indigo-500/30">📹</div>
          <h1 className="text-2xl font-black text-white">{roomInfo.title}</h1>
          <p className="text-gray-400 text-sm">You have been invited to a video meeting</p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && joinRoom()}
            placeholder="Enter your display name..."
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
          />
        </div>
        <button
          onClick={joinRoom}
          disabled={!name.trim()}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
        >
          🎥 Join Meeting
        </button>
        <p className="text-xs text-center text-gray-500">Camera &amp; microphone access will be requested.</p>
      </div>
    </div>
  );

  // ── In-Call ──────────────────────────────────────────────────
  const count = 1 + peers.length; // local + remote
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
          <span className="text-white font-black text-sm">{roomInfo.title}</span>
          <span className="text-gray-500 text-xs font-bold">· {count} participant{count !== 1 ? "s" : ""}</span>
        </div>
        <span className="text-gray-500 text-xs font-mono">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Video Grid */}
        <div className={`flex-1 grid ${gridClass} gap-2 p-2 overflow-hidden`}>
          {/* Local */}
          <VideoTile name={`${name} (You)`} isLocal localRef={localRef} />
          {/* Remotes */}
          {peers.map((p) => (
            <VideoTile key={p.socketId} name={p.name} stream={p.stream} />
          ))}
        </div>

        {/* Chat Drawer */}
        {chatOpen && (
          <ChatPanel
            log={chatLog}
            value={chatMsg}
            onChange={setChatMsg}
            onSend={sendChat}
            onClose={() => setChatOpen(false)}
          />
        )}
      </div>

      {/* Controls */}
      <div className="shrink-0 bg-gray-900/90 backdrop-blur border-t border-gray-800 px-6 py-4 flex items-center justify-center gap-3">
        <Btn active={!micOn} label={micOn ? "Mute" : "Unmute"} icon={micOn ? "🎙️" : "🔇"} onClick={toggleMic} danger={!micOn} />
        <Btn active={!camOn} label={camOn ? "Stop Video" : "Start Video"} icon="📷" onClick={toggleCam} danger={!camOn} />
        <Btn active={screenSharing} label={screenSharing ? "Stop Share" : "Share Screen"} icon="🖥️" onClick={toggleScreen} />
        <button
          onClick={() => { setChatOpen((v) => !v); setUnread(0); }}
          className={`relative flex flex-col items-center gap-1 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${chatOpen ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
        >
          💬 Chat
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>
        <button onClick={leaveRoom} className="flex flex-col items-center gap-1 px-8 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition-all">
          📵 Leave
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
          <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-black text-gray-400">
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
        {log.length === 0 && <p className="text-gray-600 text-xs text-center py-8">No messages yet 👋</p>}
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
