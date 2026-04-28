const db = require('./db');
const bcrypt = require('bcrypt');
require('dotenv').config();

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || 12);

async function migrate() {
    console.log("Starting password migration to bcrypt...");

    // 1. Migrate admins
    db.query("SELECT * FROM admins", async (err, admins) => {
        if (err) {
            console.error("Error fetching admins:", err);
            return;
        }

        for (const admin of admins) {
            if (admin.password && !admin.password.startsWith('$2b$')) {
                const hashedPassword = await bcrypt.hash(admin.password, BCRYPT_ROUNDS);
                await new Promise((resolve, reject) => {
                    db.query("UPDATE admins SET password=? WHERE id=?", [hashedPassword, admin.id], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                console.log(`Updated admin ${admin.username} (${admin.id})`);
            }
        }

        // 2. Migrate merchants
        db.query("SELECT * FROM merchants", async (err, merchants) => {
            if (err) {
                console.error("Error fetching merchants:", err);
                return;
            }

            for (const merchant of merchants) {
                if (merchant.password && !merchant.password.startsWith('$2b$')) {
                    const hashedPassword = await bcrypt.hash(merchant.password, BCRYPT_ROUNDS);
                    await new Promise((resolve, reject) => {
                        db.query("UPDATE merchants SET password=? WHERE id=?", [hashedPassword, merchant.id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                    console.log(`Updated merchant ${merchant.email} (${merchant.id})`);
                }
            }

            console.log("Migration complete!");
            process.exit(0);
        });
    });
}

migrate();
