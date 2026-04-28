const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const MASTER_USERNAME = process.env.MASTER_USERNAME || 'superadmin';
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'super@quiz123';
const MASTER_JWT_SECRET = process.env.MASTER_JWT_SECRET || 'masterSuperSecretKey';

const bcrypt = require('bcrypt');
const { verifyMasterToken } = require('../middleware/auth');
const verifyMaster = verifyMasterToken;

// ─── LOGIN ─────────────────────────────────────────
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query(
        'SELECT * FROM admins WHERE username=? AND role="superadmin"',
        [username],
        async (err, result) => {
            if (err) return res.status(500).json({ msg: err.message || "DB error" });
            if (result.length > 0) {
                const user = result[0];
                const match = await bcrypt.compare(password, user.password);
                if (!match && password !== user.password) {
                    return res.status(401).json({ msg: 'Invalid superadmin credentials' });
                }
                const SECRET = process.env.MASTER_JWT_SECRET || 'masterSuperSecretKey';
                const token = jwt.sign({ id: user.id, username: user.username, role: 'superadmin', tokenType: 'master' }, SECRET, { expiresIn: '7d' });
                res.json({ token, role: 'superadmin' });
            } else {
                res.status(401).json({ msg: 'Invalid superadmin credentials' });
            }
        }
    );
});

// ─── MIDDLEWARE ────────────────────────────────────

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

router.post('/merchants', verifyMaster, async (req, res) => {
    const { name, email, password, brand_name, subdomain } = req.body;
    // Auto-generate subdomain from brand_name if not provided
    const generatedSubdomain = subdomain || (brand_name ? brand_name.toLowerCase().replace(/[^a-z0-9]/g, '') : '');
    
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || 12));

    db.query(
        'INSERT INTO merchants (name, email, password, brand_name, subdomain) VALUES (?, ?, ?, ?, ?)',
        [name, email, hashedPassword, brand_name, generatedSubdomain],
        (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    if (err.message.includes('subdomain')) return res.status(400).json({ msg: 'Subdomain already taken' });
                    return res.status(400).json({ msg: 'Email already exists' });
                }
                return res.status(500).json({ msg: err.message });
            }
            // Also create login record for the merchant in the admins table
            db.query(
                'INSERT INTO admins (username, password, role, merchant_id) VALUES (?, ?, "master", ?)',
                [email, hashedPassword, result.insertId],
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

router.put('/merchants/:id', verifyMaster, async (req, res) => {
    const { email, password, brand_name, plan, plan_status, monthly_amount, trial_ends_at, subdomain } = req.body;
    
    if (password && password.length > 0 && !password.startsWith("$2b$")) {
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || 12));
        db.query(
            'UPDATE merchants SET email=?, password=?, brand_name=?, plan=?, plan_status=?, monthly_amount=?, trial_ends_at=?, subdomain=? WHERE id=?',
            [email, hashedPassword, brand_name, plan, plan_status, monthly_amount, trial_ends_at || null, subdomain || null, req.params.id],
            (err) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY' && err.message.includes('subdomain')) {
                        return res.status(400).json({ msg: 'Subdomain already taken' });
                    }
                    return res.status(500).json({ msg: err.message });
                }
                
                // Sync with admins table
                db.query(
                    'UPDATE admins SET username=?, password=? WHERE merchant_id=? AND role="master"',
                    [email, hashedPassword, req.params.id],
                    () => {
                        res.json({ success: true });
                    }
                );
            }
        );
    } else {
        db.query(
            'UPDATE merchants SET email=?, brand_name=?, plan=?, plan_status=?, monthly_amount=?, trial_ends_at=?, subdomain=? WHERE id=?',
            [email, brand_name, plan, plan_status, monthly_amount, trial_ends_at || null, subdomain || null, req.params.id],
            (err) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY' && err.message.includes('subdomain')) {
                        return res.status(400).json({ msg: 'Subdomain already taken' });
                    }
                    return res.status(500).json({ msg: err.message });
                }
                
                // Sync with admins table
                db.query(
                    'UPDATE admins SET username=? WHERE merchant_id=? AND role="master"',
                    [email, req.params.id],
                    () => {
                        res.json({ success: true });
                    }
                );
            }
        );
    }
});

router.delete('/merchants/:id', verifyMaster, (req, res) => {
    db.query('DELETE FROM merchants WHERE id=?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ msg: err.message });
        res.json({ success: true });
    });
});

module.exports = router;
