const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyMerchantToken, requireMerchantAdmin } = require('../middleware/auth');

// Update merchant profile (subdomain, brand_name)
router.put('/profile', verifyMerchantToken, requireMerchantAdmin, (req, res) => {
    const { brand_name, subdomain } = req.body;
    
    // Check if subdomain is unique if changed
    if (subdomain) {
        db.query("SELECT id FROM merchants WHERE subdomain = ? AND id != ?", [subdomain, req.user.merchant_id], (err, result) => {
            if (err) return res.status(500).json(err);
            if (result.length > 0) return res.status(400).json({ msg: "Subdomain is already taken" });
            
            updateMerchant();
        });
    } else {
        updateMerchant();
    }

    function updateMerchant() {
        db.query(
            "UPDATE merchants SET brand_name = ?, subdomain = ? WHERE id = ?",
            [brand_name, subdomain, req.user.merchant_id],
            (err) => {
                if (err) return res.status(500).json(err);
                res.json({ success: true });
            }
        );
    }
});

module.exports = router;
