const db = require("../db/database");

function createLedgerEntry(data) {
    const { account_id, transaction_id, amount, type } = data;

    const stmt = db.prepare(`
        INSERT INTO ledger_entries
        (account_id, transaction_id, amount, type)
        VALUES (?, ?, ?, ?)
    `);

    const info = stmt.run(
        account_id,
        transaction_id,
        amount,
        type
    );

    return {
        id: info.lastInsertRowid,
        ...data
    };
}

function getLedgerByTransactionId(transactionId) {
    return db.prepare(`
        SELECT *
        FROM ledger_entries
        WHERE transaction_id = ?
    `).all(transactionId);
}

function getAccountTotals(accountId) {
    return db.prepare(`
        SELECT
            COALESCE(SUM(
                CASE WHEN type = 'CREDIT'
                THEN amount ELSE 0 END
            ), 0) AS totalCredit,

            COALESCE(SUM(
                CASE WHEN type = 'DEBIT'
                THEN amount ELSE 0 END
            ), 0) AS totalDebit,

            COUNT(DISTINCT transaction_id)
                AS transactionCount

        FROM ledger_entries
        WHERE account_id = ?
    `).get(accountId);
}

module.exports = {
    createLedgerEntry,
    getLedgerByTransactionId,
    getAccountTotals
};