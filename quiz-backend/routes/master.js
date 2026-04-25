const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const MASTER_USERNAME = process.env.MASTER_USERNAME || 'superadmin';
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'super@quiz123';
const MASTER_JWT_SECRET = process.env.MASTER_JWT_SECRET || 'masterSuperSecretKey';

// ─── LOGIN ─────────────────────────────────────────
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query(
        'SELECT * FROM admins WHERE username=? AND password=? AND role="superadmin"',
        [username, password],
        (err, result) => {
            if (err) return res.status(500).json({ msg: err.message || "DB error" });
            if (result.length > 0) {
                const user = result[0];
                const SECRET = process.env.JWT_SECRET || 'masterSuperSecretKey';
                const token = jwt.sign({ id: user.id, username: user.username, role: 'superadmin' }, SECRET, { expiresIn: '7d' });
                res.json({ token, role: 'superadmin' });
            } else {
                res.status(401).json({ msg: 'Invalid superadmin credentials' });
            }
        }
    );
});

// ─── MIDDLEWARE ────────────────────────────────────
const verifyMaster = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return res.status(403).json({ msg: 'No token' });
    const token = header.split(' ')[1];
    try {
        const SECRET = process.env.JWT_SECRET || 'masterSuperSecretKey';
        req.user = jwt.verify(token, SECRET);
        if (req.user.role !== 'superadmin') throw new Error();
        next();
    } catch {
        res.status(401).json({ msg: 'Invalid or expired master token' });
    }
};

// ─── STATS ─────────────────────────────────────────
router.get('/stats', verifyMaster, (req, res) => {
    db.query('SELECT COUNT(*) as totalMerchants FROM merchants', (err1, res1) => {
        db.query('SELECT SUM(monthly_amount) as mrr FROM merchants WHERE plan_status="active"', (err2, res2) => {
            db.query('SELECT COUNT(*) as totalLeads FROM leads', (err3, res3) => {
                db.query('SELECT COUNT(*) as totalForms FROM forms', (err4, res4) => {
                    res.json({
                        merchants: res1?.[0]?.totalMerchants || 0,
                        mrr: res2?.[0]?.mrr || 0,
                        leads: res3?.[0]?.totalLeads || 0,
                        forms: res4?.[0]?.totalForms || 0
                    });
                });
            });
        });
    });
});

// ─── MERCHANTS CRUD ────────────────────────────────
router.get('/merchants', verifyMaster, (req, res) => {
    db.query('SELECT * FROM merchants ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ msg: err.message });
        res.json(results);
    });
});

router.post('/merchants', verifyMaster, (req, res) => {
    const { name, email, password, brand_name } = req.body;
    db.query(
        'INSERT INTO merchants (name, email, password, brand_name) VALUES (?, ?, ?, ?)',
        [name, email, password, brand_name],
        (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ msg: 'Email already exists' });
                return res.status(500).json({ msg: err.message });
            }
            // Also create login record for the merchant in the admins table
            db.query(
                'INSERT INTO admins (username, password, role, merchant_id) VALUES (?, ?, "master", ?)',
                [email, password, result.insertId],
                (err2) => {
                    // Ignore duplicate admin username error if it already exists
                    res.json({ success: true, merchantId: result.insertId });
                }
            );
        }
    );
});

router.get('/merchants/:id', verifyMaster, (req, res) => {
    db.query('SELECT * FROM merchants WHERE id=?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ msg: err.message });
        if (!results.length) return res.status(404).json({ msg: "Not found" });
        res.json(results[0]);
    });
});

router.put('/merchants/:id', verifyMaster, (req, res) => {
    const { email, password, brand_name, plan, plan_status, monthly_amount, trial_ends_at } = req.body;
    db.query(
        'UPDATE merchants SET email=?, password=?, brand_name=?, plan=?, plan_status=?, monthly_amount=?, trial_ends_at=? WHERE id=?',
        [email, password, brand_name, plan, plan_status, monthly_amount, trial_ends_at || null, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ msg: err.message });
            
            // Sync with admins table
            db.query(
                'UPDATE admins SET username=?, password=? WHERE merchant_id=? AND role="master"',
                [email, password, req.params.id],
                () => {
                    res.json({ success: true });
                }
            );
        }
    );
});

router.delete('/merchants/:id', verifyMaster, (req, res) => {
    db.query('DELETE FROM merchants WHERE id=?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ msg: err.message });
        res.json({ success: true });
    });
});

module.exports = router;
