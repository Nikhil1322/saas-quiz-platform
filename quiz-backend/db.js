const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "quiz_db",
    port: 3307,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

pool.getConnection((err, connection) => {
    if (err) console.log("DB Error:", err);
    else {
        console.log("MySQL Connected ✅");
        connection.release();
    }
});

module.exports = pool;