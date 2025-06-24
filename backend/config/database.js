const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Database file path
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'timeoff.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected successfully to', dbPath);
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Promisify database methods for easier async/await usage
const dbAsync = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },
  
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

// Test database connection
const testConnection = async () => {
  try {
    await dbAsync.get('SELECT 1 as test');
    console.log('✅ Database test query successful');
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database connection...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

module.exports = { db, dbAsync, testConnection };