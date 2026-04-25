const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Parser } = require("json2csv");


// ─── MIDDLEWARES ───────────────────────────────────

const verifyToken = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return res.status(403).json({ msg: "No token" });
    const token = header.split(" ")[1];
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ msg: "Invalid token" });
    }
};

const requireMaster = (req, res, next) => {
    if (req.user?.role !== "master" && req.user?.role !== "staff_admin") {
        return res.status(403).json({ msg: "Admin access only" });
    }
    next();
};


const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "placeholder");

// ─── LOGIN ─────────────────────────────────────────

router.post("/login", (req, res) => {
    const { username, password } = req.body;
    db.query(
        "SELECT * FROM admins WHERE username=? AND password=?",
        [username, password],
        (err, result) => {
            if (err) { console.error("Login DB error:", err); return res.status(500).json({ msg: err.message || "DB error", code: err.code }); }
            if (result.length > 0) {
                const user = result[0];
                const token = jwt.sign(
                    { id: user.id, username: user.username, role: user.role, merchant_id: user.merchant_id },
                    process.env.JWT_SECRET,
                    { expiresIn: "7d" }
                );
                res.json({ token, username: user.username, role: user.role, merchant_id: user.merchant_id });
            } else {
                res.status(401).json({ msg: "Invalid username or password" });
            }
        }
    );
});

router.post("/google-login", async (req, res) => {
    const { credential } = req.body;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload.email;

        db.query("SELECT * FROM admins WHERE username=?", [email], (err, result) => {
            if (err) return res.status(500).json({ msg: "DB error" });
            if (result.length > 0) {
                const user = result[0];
                const token = jwt.sign(
                    { id: user.id, username: user.username, role: user.role, merchant_id: user.merchant_id },
                    process.env.JWT_SECRET,
                    { expiresIn: "7d" }
                );
                res.json({ token, username: user.username, role: user.role, merchant_id: user.merchant_id });
            } else {
                res.status(401).json({ msg: "No merchant account found for this Google email. Please ask the Super Admin to create an account for you." });
            }
        });
    } catch (e) {
        console.error("Google Auth Error:", e.message);
        res.status(401).json({ msg: "Invalid Google Token" });
    }
});


// ─── PROFILE ───────────────────────────────────────

router.get("/profile", verifyToken, (req, res) => {
    const { id, username, merchant_id } = req.user;
    
    let sql = "SELECT id, username, role, created_at FROM admins WHERE id=?";
    const val = id || username;
    
    if (merchant_id) {
        sql = "SELECT a.id, a.username, a.role, a.created_at, m.plan, m.plan_status, m.trial_ends_at, m.brand_name, m.api_key, m.webhook_url FROM admins a LEFT JOIN merchants m ON a.merchant_id = m.id WHERE a.id=?";
    }

    db.query(sql, [val], (err, result) => {
        if (err) return res.status(500).json({ msg: "DB error" });
        if (result.length === 0) {
            return res.json({ id, username, role: req.user.role, created_at: null });
        }
        res.json(result[0]);
    });
});

// ─── SETTINGS ──────────────────────────────────────

router.post("/settings/webhook", verifyToken, requireMaster, (req, res) => {
    const { webhook_url } = req.body;
    db.query("UPDATE merchants SET webhook_url=? WHERE id=?", [webhook_url, req.user.merchant_id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

router.post("/settings/apikey", verifyToken, requireMaster, (req, res) => {
    const api_key = "sk_live_" + crypto.randomBytes(24).toString("hex");
    db.query("UPDATE merchants SET api_key=? WHERE id=?", [api_key, req.user.merchant_id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true, api_key });
    });
});


// ─── USER MANAGEMENT (master only) ─────────────────

router.get("/users", verifyToken, requireMaster, (req, res) => {
    db.query(
        "SELECT id, username, role, created_at FROM admins WHERE merchant_id=? ORDER BY created_at DESC",
        [req.user.merchant_id],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        }
    );
});

router.delete("/users/:id", verifyToken, requireMaster, (req, res) => {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) return res.status(400).json({ msg: "Cannot delete yourself" });
    db.query("DELETE FROM admins WHERE id=? AND merchant_id=?", [id, req.user.merchant_id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

// ─── INVITATIONS ────────────────────────────────────

router.post("/invite", verifyToken, requireMaster, (req, res) => {
    const { role } = req.body; // 'staff_admin', 'staff_editor', or 'staff_viewer'
    const token = crypto.randomBytes(32).toString("hex");
    db.query("INSERT INTO invitations (token, merchant_id, role) VALUES (?, ?, ?)", [token, req.user.merchant_id, role || 'staff_viewer'], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ token, link: `/invite?token=${token}` });
    });
});

router.post("/accept-invite", (req, res) => {
    const { token, username, password } = req.body;
    if (!token || !username || !password) return res.status(400).json({ msg: "Missing fields" });

    db.query("SELECT * FROM invitations WHERE token=? AND used=0", [token], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length === 0) return res.status(400).json({ msg: "Invalid or already used invite link" });

        const merchant_id = result[0].merchant_id;
        const role = result[0].role || 'staff_viewer';

        db.query(
            "INSERT INTO admins (username, password, role, merchant_id) VALUES (?, ?, ?, ?)",
            [username, password, role, merchant_id],
            (err2) => {
                if (err2) return res.status(400).json({ msg: "Username already taken" });
                db.query("UPDATE invitations SET used=1 WHERE token=?", [token]);
                res.json({ success: true });
            }
        );
    });
});


// ─── QUIZ CONFIG ────────────────────────────────────

router.get("/quiz-config", verifyToken, (req, res) => {
    db.query("SELECT data FROM quiz_config WHERE merchant_id=?", [req.user.merchant_id], (err, result) => {
        if (err || result.length === 0) return res.json({});
        try {
            res.json(JSON.parse(result[0].data));
        } catch {
            res.json({});
        }
    });
});

router.post("/quiz-config", verifyToken, requireMaster, (req, res) => {
    const data = JSON.stringify(req.body);
    // Since we added merchant_id, we should update based on it.
    // Ensure the table has a unique key on merchant_id if using ON DUPLICATE KEY UPDATE, 
    // or just DELETE and INSERT. Let's do DELETE and INSERT to be safe.
    db.query("DELETE FROM quiz_config WHERE merchant_id=?", [req.user.merchant_id], () => {
        db.query(
            "INSERT INTO quiz_config (merchant_id, data) VALUES (?, ?)",
            [req.user.merchant_id, data],
            (err) => {
                if (err) return res.status(500).json(err);
                res.json({ success: true });
            }
        );
    });
});


// ─── LEADS ──────────────────────────────────────────

router.get("/leads", verifyToken, (req, res) => {
    db.query("SELECT * FROM leads WHERE merchant_id=? ORDER BY created_at DESC", [req.user.merchant_id], (err, data) => {
        if (err) return res.status(500).json(err);
        res.json(data);
    });
});

router.post("/update-status", verifyToken, (req, res) => {
    const { id, status } = req.body;
    db.query("UPDATE leads SET status=? WHERE id=? AND merchant_id=?", [status, id, req.user.merchant_id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});


// ─── EXPORT CSV ─────────────────────────────────────

router.get("/export", verifyToken, (req, res) => {
    db.query("SELECT * FROM leads WHERE merchant_id=?", [req.user.merchant_id], (err, rows) => {
        if (err) return res.status(500).json(err);
        const formatted = rows.map((row) => {
            let d = {};
            try { d = JSON.parse(row.answers || "{}"); } catch { }
            return {
                name: row.name, phone: row.phone,
                city: d.basic?.city || "", skin_type: d.skin_profile?.skin_type || "",
                concerns: d.skin_profile?.concerns?.join(", ") || "",
                routine: d.routine?.routine_type || "", climate: d.lifestyle?.climate || "",
                status: row.status,
            };
        });
        const parser = new Parser();
        const csv = parser.parse(formatted);
        res.header("Content-Type", "text/csv");
        res.attachment("leads.csv");
        res.send(csv);
    });
});


module.exports = router;