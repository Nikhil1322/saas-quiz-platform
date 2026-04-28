// middleware/auth.js
// Shared JWT verification utilities for the SaaS platform
// Merchant tokens and Master tokens use SEPARATE secrets and payloads

const jwt = require("jsonwebtoken");

const MERCHANT_SECRET = process.env.JWT_SECRET;
const MASTER_SECRET = process.env.MASTER_JWT_SECRET;

/**
 * Verifies a Merchant (admin/staff) token.
 * Rejects tokens that are not of tokenType "merchant".
 */
const verifyMerchantToken = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return res.status(403).json({ msg: "No token provided" });
    const token = header.split(" ")[1];
    if (!token) return res.status(403).json({ msg: "Malformed auth header" });
    try {
        const decoded = jwt.verify(token, MERCHANT_SECRET);
        if (decoded.tokenType !== "merchant") {
            return res.status(403).json({ msg: "Invalid token type for this endpoint" });
        }
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ msg: "Token expired. Please log in again." });
        }
        return res.status(401).json({ msg: "Invalid or tampered token" });
    }
};

/**
 * Verifies a Master (superadmin) token.
 * Rejects tokens that are not of tokenType "master".
 */
const verifyMasterToken = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return res.status(403).json({ msg: "No token provided" });
    const token = header.split(" ")[1];
    if (!token) return res.status(403).json({ msg: "Malformed auth header" });
    try {
        const decoded = jwt.verify(token, MASTER_SECRET);
        if (decoded.tokenType !== "master") {
            return res.status(403).json({ msg: "Invalid token type for this endpoint" });
        }
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ msg: "Master token expired. Please log in again." });
        }
        return res.status(401).json({ msg: "Invalid or tampered master token" });
    }
};

/**
 * Role guard — use AFTER verifyMerchantToken
 * Only allows role: "master" or "staff_admin"
 */
const requireMerchantAdmin = (req, res, next) => {
    if (req.user?.role !== "master" && req.user?.role !== "staff_admin") {
        return res.status(403).json({ msg: "Admin-level merchant access required" });
    }
    next();
};

module.exports = { verifyMerchantToken, verifyMasterToken, requireMerchantAdmin };
