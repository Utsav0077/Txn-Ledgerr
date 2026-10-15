const db = require("../db/database");

async function createTransaction(data) {
    const { from_account_id, to_account_id, amount, idempotency_key, description, status } = data;
    const stmt = db.prepare(`
        INSERT INTO transactions (from_account_id, to_account_id, amount, idempotency_key, description, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(from_account_id, to_account_id, amount, idempotency_key, description, status || 'PENDING');
    return { id: info.lastInsertRowid, ...data };
}

async function findTransactionByIdempotencyKey(key) {
    return db.prepare("SELECT * FROM transactions WHERE idempotency_key = ?").get(key);
}

async function findTransactionById(id) {
    return db.prepare("SELECT * FROM transactions WHERE id = ?").get(id);
}

async function updateTransactionStatus(id, status) {
    db.prepare("UPDATE transactions SET status = ? WHERE id = ?").run(status, id);
}

module.exports = { createTransaction, findTransactionByIdempotencyKey, findTransactionById, updateTransactionStatus };
