const mysql = require('mysql2/promise')
const dotenv = require('dotenv');
dotenv.config();
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

pool.query('SELECT 1')
  .then(() => console.log('✅ MySQL pool is working!'))
  .catch((err) => console.error('❌ Pool test failed:', err));
module.exports = pool;