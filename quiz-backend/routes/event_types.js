const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyMerchantToken } = require('../middleware/auth');

// List event types
router.get('/', verifyMerchantToken, (req, res) => {
    db.query("SELECT * FROM event_types WHERE merchant_id = ? ORDER BY created_at DESC", [req.user.merchant_id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// Create event type
router.post('/', verifyMerchantToken, (req, res) => {
    const { title, description, duration_mins, price } = req.body;
    const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    
    db.query(
        "INSERT INTO event_types (merchant_id, title, description, duration_mins, price, slug) VALUES (?, ?, ?, ?, ?, ?)",
        [req.user.merchant_id, title, description, duration_mins || 30, price || 0, slug],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ success: true, id: result.insertId });
        }
    );
});

// Update event type
router.put('/:id', verifyMerchantToken, (req, res) => {
    const { title, description, duration_mins, price, is_active } = req.body;
    db.query(
        "UPDATE event_types SET title = ?, description = ?, duration_mins = ?, price = ?, is_active = ? WHERE id = ? AND merchant_id = ?",
        [title, description, duration_mins, price, is_active, req.params.id, req.user.merchant_id],
        (err) => {
            if (err) return res.status(500).json(err);
            res.json({ success: true });
        }
    );
});

// Delete event type
router.delete('/:id', verifyMerchantToken, (req, res) => {
    db.query("DELETE FROM event_types WHERE id = ? AND merchant_id = ?", [req.params.id, req.user.merchant_id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

module.exports = router;
