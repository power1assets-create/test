// db.js — PostgreSQL connection pool
// ใช้ pg.Pool เพื่อ reuse connection ไม่ต้อง connect/disconnect ทุก query

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Railway ต้องการ SSL
});

// ทดสอบ connection ตอน startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL');
    release();
  }
});

module.exports = pool;
