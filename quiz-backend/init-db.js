const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
  });

  console.log("Connected to Aiven DB for migration...");

  const queries = [
    `CREATE TABLE IF NOT EXISTS merchants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      brand_name VARCHAR(255),
      subdomain VARCHAR(255) UNIQUE,
      plan ENUM('starter') DEFAULT 'starter',
      plan_status ENUM('trial', 'active', 'cancelled', 'expired') DEFAULT 'trial',
      trial_ends_at DATE,
      monthly_amount DECIMAL(10, 2) DEFAULT 999.00,
      leads_count INT DEFAULT 0,
      forms_count INT DEFAULT 0,
      api_key VARCHAR(100),
      webhook_url VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('master', 'staff_admin', 'staff_editor', 'staff_viewer') DEFAULT 'staff_viewer',
      merchant_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX(merchant_id)
    )`,

    `CREATE TABLE IF NOT EXISTS forms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      merchant_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      status ENUM('draft', 'published') DEFAULT 'draft',
      config LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX(merchant_id)
    )`,

    `CREATE TABLE IF NOT EXISTS leads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      merchant_id INT NOT NULL,
      form_id INT NOT NULL,
      name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      answers LONGTEXT,
      status VARCHAR(50) DEFAULT 'new',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX(merchant_id),
      INDEX(form_id)
    )`,

    `CREATE TABLE IF NOT EXISTS quiz_config (
      id INT AUTO_INCREMENT PRIMARY KEY,
      merchant_id INT NOT NULL UNIQUE,
      data LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS invitations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      token VARCHAR(100) NOT NULL UNIQUE,
      merchant_id INT NOT NULL,
      role VARCHAR(50) DEFAULT 'staff_viewer',
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS event_types (
      id INT AUTO_INCREMENT PRIMARY KEY,
      merchant_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      duration_mins INT NOT NULL DEFAULT 30,
      price DECIMAL(10, 2) DEFAULT 0.00,
      slug VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (merchant_id),
      INDEX (slug)
    )`,

    `CREATE TABLE IF NOT EXISTS availability (
      id INT AUTO_INCREMENT PRIMARY KEY,
      merchant_id INT NOT NULL,
      day_of_week INT NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      slot_duration_mins INT DEFAULT 30,
      INDEX (merchant_id)
    )`,

    `CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      merchant_id INT NOT NULL,
      event_type_id INT,
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
      INDEX (merchant_id),
      INDEX (event_type_id)
    )`,

    `CREATE TABLE IF NOT EXISTS meetings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      merchant_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      room_name VARCHAR(255) NOT NULL UNIQUE,
      room_url VARCHAR(255),
      start_time DATETIME,
      recording_url TEXT,
      transcript LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (merchant_id)
    )`
  ];

  for (let query of queries) {
    try {
      await connection.query(query);
      console.log("Success executing query:", query.substring(0, 50) + "...");
    } catch (err) {
      console.error("Error executing query:", err.message);
    }
  }

  await connection.end();
  console.log("Database Migration Complete! 🚀");
}

initDB().catch(console.error);
