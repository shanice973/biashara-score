// db.js
const mysql = require('mysql2');
require('dotenv').config(); 

// Create the connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',      // Fixed: lowercase 'user'
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'biashara_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

console.log("✅ MySQL Pool Created..."); // You MUST see this in your terminal

module.exports = promisePool;