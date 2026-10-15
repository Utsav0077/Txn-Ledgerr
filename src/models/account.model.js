const db = require("../db/database");

async function createAccount(userId, currency = 'INR') {
    const stmt = db.prepare("INSERT INTO accounts (user_id, currency) VALUES (?, ?)");
    const info = stmt.run(userId, currency);
    return { id: info.lastInsertRowid, user_id: userId, status: 'ACTIVE', currency, balance: 0 };
}

async function findAccountById(id) {
    return db.prepare("SELECT * FROM accounts WHERE id = ?").get(id);
}

async function findAccountsByUserId(userId) {
    return db.prepare("SELECT * FROM accounts WHERE user_id = ?").all(userId);
}

async function findAccountForUpdate(accountId) {
    return db.prepare("SELECT * FROM accounts WHERE id = ?").get(accountId);
}

module.exports = { createAccount, findAccountById, findAccountsByUserId, findAccountForUpdate };
