const mysql = require('mysql2');
require('dotenv').config();

const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'quiz_db',
    port: parseInt(process.env.DB_PORT || 3306)
};

console.log('--- DB DIAGNOSTIC ---');
console.log('Target:', config.host + ':' + config.port);
console.log('User:', config.user);
console.log('DB:', config.database);

const connection = mysql.createConnection(config);

connection.connect((err) => {
    if (err) {
        console.error('\n❌ CONNECTION FAILED!');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        
        if (err.code === 'ECONNREFUSED') {
            console.log('\nADVICE: Your MySQL server is NOT running. Please open XAMPP and click START next to MySQL.');
        } else if (err.code === 'ER_BAD_DB_ERROR') {
            console.log('\nADVICE: The database "' + config.database + '" does not exist. Please create it in phpMyAdmin.');
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\nADVICE: Access denied. Check your DB_USER and DB_PASSWORD in .env.');
        }
    } else {
        console.log('\n✅ CONNECTION SUCCESSFUL!');
        connection.query('SHOW TABLES', (err2, tables) => {
            if (err2) {
                console.error('Failed to list tables:', err2.message);
            } else {
                console.log('Tables found:', tables.length);
                tables.forEach(t => console.log(' - ' + Object.values(t)[0]));
            }
            connection.end();
        });
    }
});
