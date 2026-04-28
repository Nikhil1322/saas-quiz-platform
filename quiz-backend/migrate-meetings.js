const db = require('./db');

const migrate = () => {
    console.log("Creating meetings table...");

    const createMeetings = `
        CREATE TABLE IF NOT EXISTS meetings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            merchant_id INT NOT NULL,
            room_name VARCHAR(255) NOT NULL,
            room_url VARCHAR(255) NOT NULL,
            title VARCHAR(255),
            start_time DATETIME,
            status ENUM('active', 'ended') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
        )
    `;

    db.query(createMeetings, (err) => {
        if (err) {
            console.error("Error creating meetings table:", err);
            return;
        }
        console.log("Meetings table ready.");
        process.exit(0);
    });
};

migrate();
