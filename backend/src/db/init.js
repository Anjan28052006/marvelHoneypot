    require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDB() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSql);
    console.log('PostgreSQL database initialized successfully for sentinel1');
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

// Run table creation on startup
initDB();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};