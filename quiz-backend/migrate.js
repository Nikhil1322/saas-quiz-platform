const db = require('./db');

const migrate = () => {
    const queries = [
        `CREATE TABLE IF NOT EXISTS merchants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            brand_name VARCHAR(255),
            plan ENUM('starter') DEFAULT 'starter',
            plan_status ENUM('trial','active','cancelled','expired') DEFAULT 'trial',
            trial_ends_at DATE,
            monthly_amount DECIMAL(10,2) DEFAULT 999.00,
            leads_count INT DEFAULT 0,
            forms_count INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS subscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            merchant_id INT NOT NULL,
            plan VARCHAR(50) DEFAULT 'starter',
            amount DECIMAL(10,2) DEFAULT 999.00,
            status ENUM('active','cancelled','expired') DEFAULT 'active',
            starts_at DATE,
            ends_at DATE,
            payment_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    let completed = 0;
    queries.forEach(q => {
        db.query(q, (err) => {
            if (err) console.error("Error running query:", err);
            else console.log("Table created/verified successfully.");
            
            completed++;
            if (completed === queries.length) {
                console.log("Migration complete.");
                process.exit(0);
            }
        });
    });
};

migrate();
