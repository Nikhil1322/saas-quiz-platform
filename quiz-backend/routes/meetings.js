const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyMerchantToken } = require('../middleware/auth');



// Create a meeting room (WebRTC – no external dependency)
router.post('/create', verifyMerchantToken, async (req, res) => {
    try {
        const { title, start_time } = req.body;
        const roomName = `room-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString(36)}`;
        // Room URL points to our own WebRTC page
        const roomUrl = `/meet/${roomName}`;

        db.query(
            "INSERT INTO meetings (merchant_id, room_name, room_url, title, start_time) VALUES (?, ?, ?, ?, ?)",
            [req.user.merchant_id, roomName, roomUrl, title || "Instant Meeting", start_time || null],
            (err, result) => {
                if (err) return res.status(500).json(err);
                res.json({ success: true, id: result.insertId, room_name: roomName, room_url: roomUrl });
            }
        );
    } catch (err) {
        res.status(500).json({ msg: "Server error", err: err.message });
    }
});

// List meetings
router.get('/', verifyMerchantToken, (req, res) => {
    db.query("SELECT * FROM meetings WHERE merchant_id = ? ORDER BY created_at DESC", [req.user.merchant_id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// Delete/End meeting
router.delete('/:id', verifyMerchantToken, async (req, res) => {
    db.query("DELETE FROM meetings WHERE id = ? AND merchant_id = ?", [req.params.id, req.user.merchant_id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

// Public info for meeting join page
router.get('/public/:room_name', (req, res) => {
    db.query("SELECT room_url, title FROM meetings WHERE room_name = ?", [req.params.room_name], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length === 0) return res.status(404).json({ msg: "Room not found" });
        res.json(result[0]);
    });
});

// Invite participant via email (simulate for now, requires Nodemailer setup in real world)
router.post('/:id/invite', verifyMerchantToken, (req, res) => {
    const { email, link } = req.body;
    // NOTE: For real email sending, use Resend or Nodemailer here.
    console.log(`Sending meeting invite to ${email} with link: ${link}`);
    res.json({ success: true, msg: "Invite sent successfully" });
});

const multer = require('multer');
const path = require('path');

// Configure multer for meeting recordings (up to 500MB)
const storage = multer.diskStorage({
    destination: path.join(__dirname, '../uploads'),
    filename: (req, file, cb) => {
        const ext = file.mimetype === 'video/webm' ? '.webm' : path.extname(file.originalname);
        cb(null, `rec_${Date.now()}${ext}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
});

// Upload meeting recording and transcript
router.post('/:id/recording', verifyMerchantToken, upload.single('video'), (req, res) => {
    const { transcript } = req.body;
    let recording_url = null;
    if (req.file) {
        recording_url = `/uploads/${req.file.filename}`;
    }

    db.query(
        "UPDATE meetings SET recording_url = COALESCE(?, recording_url), transcript = COALESCE(?, transcript) WHERE id = ? AND merchant_id = ?",
        [recording_url, transcript, req.params.id, req.user.merchant_id],
        (err) => {
            if (err) return res.status(500).json(err);
            res.json({ success: true, recording_url });
        }
    );
});

module.exports = router;
