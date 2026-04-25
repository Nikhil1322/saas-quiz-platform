const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h) return res.status(403).json({ msg: 'No token' });
  try { req.user = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ msg: 'Invalid token' }); }
};

// GET /api/admin/forms  — list all forms with lead count
router.get('/', verifyToken, (req, res) => {
  db.query(
    `SELECT f.id, f.name, f.type, f.status, f.created_at, f.updated_at,
     COUNT(l.id) as lead_count
     FROM forms f LEFT JOIN leads l ON l.form_id = f.id
     WHERE f.merchant_id=?
     GROUP BY f.id ORDER BY f.updated_at DESC`,
    [req.user.merchant_id],
    (err, result) => {
      if (err) return res.status(500).json({ msg: err.message });
      res.json(result);
    }
  );
});

// GET /api/admin/forms/:id
router.get('/:id', verifyToken, (req, res) => {
  db.query('SELECT * FROM forms WHERE id=? AND merchant_id=?', [req.params.id, req.user.merchant_id], (err, r) => {
    if (err) return res.status(500).json({ msg: err.message });
    if (!r.length) return res.status(404).json({ msg: 'Not found' });
    const form = r[0];
    try { form.config = JSON.parse(form.config); } catch { form.config = {}; }
    res.json(form);
  });
});

// POST /api/admin/forms  — create form
router.post('/', verifyToken, (req, res) => {
  if (req.user?.role === 'staff_viewer') return res.status(403).json({ msg: 'Viewers cannot create forms' });
  const { name, type, config } = req.body;
  db.query(
    "INSERT INTO forms (name, type, config, status, created_by, merchant_id) VALUES (?, ?, ?, 'draft', ?, ?)",
    [name || 'Untitled Form', type || 'quiz', JSON.stringify(config || {}), req.user.id, req.user.merchant_id],
    (err, r) => {
      if (err) return res.status(500).json({ msg: err.message });
      res.json({ id: r.insertId, success: true });
    }
  );
});

// PUT /api/admin/forms/:id  — update form
router.put('/:id', verifyToken, (req, res) => {
  if (req.user?.role === 'staff_viewer') return res.status(403).json({ msg: 'Viewers cannot edit forms' });
  const { name, config, status } = req.body;
  db.query(
    'UPDATE forms SET name=?, config=?, status=?, updated_at=NOW() WHERE id=? AND merchant_id=?',
    [name, JSON.stringify(config), status, req.params.id, req.user.merchant_id],
    (err) => {
      if (err) return res.status(500).json({ msg: err.message });
      res.json({ success: true });
    }
  );
});

// DELETE /api/admin/forms/:id  — master only
router.delete('/:id', verifyToken, (req, res) => {
  if (req.user?.role !== 'master' && req.user?.role !== 'staff_admin') return res.status(403).json({ msg: 'Admin only' });
  db.query('DELETE FROM forms WHERE id=? AND merchant_id=?', [req.params.id, req.user.merchant_id], (err) => {
    if (err) return res.status(500).json({ msg: err.message });
    res.json({ success: true });
  });
});

// GET /api/admin/forms/:id/leads — leads for a specific form
router.get('/:id/leads', verifyToken, (req, res) => {
  db.query(
    'SELECT * FROM leads WHERE form_id=? AND merchant_id=? ORDER BY created_at DESC',
    [req.params.id, req.user.merchant_id],
    (err, r) => {
      if (err) return res.status(500).json({ msg: err.message });
      res.json(r);
    }
  );
});

module.exports = router;
