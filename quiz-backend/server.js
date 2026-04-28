require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve uploaded images publicly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/img', express.static(path.join(__dirname, 'uploads')));

app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/forms', require('./routes/forms'));
app.use('/api/admin/bookings', require('./routes/bookings'));
app.use('/api/admin/event-types', require('./routes/event_types'));
app.use('/api/admin/meetings', require('./routes/meetings'));
app.use('/api/admin/merchant', require('./routes/merchant'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/quiz', require('./routes/quiz_upload'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/master', require('./routes/master'));

// ─── WebRTC Signaling Server via Socket.IO ────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// rooms: { roomName: [{ socketId, peerId, name }] }
const rooms = {};

io.on('connection', (socket) => {
  console.log('[WS] connected:', socket.id);

  socket.on('join-room', ({ roomName, peerId, name }) => {
    socket.join(roomName);
    if (!rooms[roomName]) rooms[roomName] = [];

    // Notify existing peers about the new participant
    rooms[roomName].forEach(peer => {
      io.to(peer.socketId).emit('user-joined', { peerId, name, socketId: socket.id });
    });

    rooms[roomName].push({ socketId: socket.id, peerId, name });

    // Send list of existing peers to the new joiner
    socket.emit('room-users', rooms[roomName].filter(p => p.socketId !== socket.id));

    console.log(`[WS] ${name} joined room ${roomName} (${rooms[roomName].length} users)`);
  });

  // Forward WebRTC offer
  socket.on('offer', ({ to, from, offer, name }) => {
    io.to(to).emit('offer', { from, offer, name });
  });

  // Forward WebRTC answer
  socket.on('answer', ({ to, from, answer }) => {
    io.to(to).emit('answer', { from, answer });
  });

  // Forward ICE candidates
  socket.on('ice-candidate', ({ to, from, candidate }) => {
    io.to(to).emit('ice-candidate', { from, candidate });
  });

  // Screen share toggle broadcast
  socket.on('screen-share', ({ roomName, sharing }) => {
    socket.to(roomName).emit('screen-share', { socketId: socket.id, sharing });
  });

  // Chat message — broadcast to OTHERS only, sender adds locally
  socket.on('chat-message', ({ roomName, name, message }) => {
    const msg = { name, message, time: new Date().toLocaleTimeString() };
    socket.to(roomName).emit('chat-message', msg);
  });

  // Speech Transcript broadcast
  socket.on('transcript', ({ roomName, name, text }) => {
    io.in(roomName).emit('transcript', { name, text, time: new Date().toLocaleTimeString() });
  });

  socket.on('disconnect', () => {
    Object.keys(rooms).forEach(roomName => {
      const before = rooms[roomName].length;
      rooms[roomName] = rooms[roomName].filter(p => p.socketId !== socket.id);
      if (rooms[roomName].length < before) {
        socket.to(roomName).emit('user-left', { socketId: socket.id });
        if (rooms[roomName].length === 0) delete rooms[roomName];
      }
    });
    console.log('[WS] disconnected:', socket.id);
  });
});

server.listen(5000, () => console.log('Server + Socket.IO running on port 5000'));