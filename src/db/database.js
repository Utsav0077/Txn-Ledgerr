const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(__dirname, "../../data/ledger.db");
// Ensure the database file exists (better-sqlite3 handles this,
// but we want to ensure the folder is there if it wasn't)
if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new Database(dbPath, { verbose: console.log });

// Enable foreign key support
db.pragma("foreign_keys = ON");

module.exports = db;
