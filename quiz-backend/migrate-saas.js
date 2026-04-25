const db = require('./db');

const migrate = async () => {
    const queries = [
        "ALTER TABLE admins ADD COLUMN IF NOT EXISTS merchant_id INT",
        "ALTER TABLE forms ADD COLUMN IF NOT EXISTS merchant_id INT",
        "ALTER TABLE leads ADD COLUMN IF NOT EXISTS merchant_id INT",
        // Associate existing test data to merchant_id = 1 (we assume the superadmin or first merchant is ID 1)
        "UPDATE admins SET merchant_id = 1 WHERE merchant_id IS NULL AND role != 'superadmin'",
        "UPDATE forms SET merchant_id = 1 WHERE merchant_id IS NULL",
        "UPDATE leads SET merchant_id = 1 WHERE merchant_id IS NULL",
    ];

    for (const q of queries) {
        await new Promise((resolve) => {
            db.query(q, (err) => {
                if (err) {
                    if (err.code === 'ER_DUP_FIELDNAME') {
                        // ignore if already exists
                        resolve();
                    } else {
                        console.error("Error running query:", q, err);
                        resolve();
                    }
                } else {
                    resolve();
                }
            });
        });
    }

    console.log("Multi-tenancy migration complete.");
    process.exit(0);
};

migrate();
