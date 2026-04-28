const db = require('./db');

const migrate = () => {
    console.log("Creating bookings tables...");

    const createAvailability = `
        CREATE TABLE IF NOT EXISTS availability (
            id INT AUTO_INCREMENT PRIMARY KEY,
            merchant_id INT NOT NULL,
            day_of_week INT NOT NULL, -- 0=Sunday, 1=Monday, etc.
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            slot_duration_mins INT DEFAULT 30,
            FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
        )
    `;

    const createBookings = `
        CREATE TABLE IF NOT EXISTS bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            merchant_id INT NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(50),
            booking_date DATE NOT NULL,
            booking_time TIME NOT NULL,
            duration_mins INT DEFAULT 30,
            status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
            notes TEXT,
            meeting_link VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
        )
    `;

    db.query(createAvailability, (err) => {
        if (err) {
            console.error("Error creating availability table:", err);
            return;
        }
        console.log("Availability table ready.");
        
        db.query(createBookings, (err) => {
            if (err) {
                console.error("Error creating bookings table:", err);
                return;
            }
            console.log("Bookings table ready.");
            process.exit(0);
        });
    });
};

migrate();
