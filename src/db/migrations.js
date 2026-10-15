const db = require("./database");

function runMigrations() {
    const schema = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password TEXT NOT NULL,
            system_user INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'FROZEN', 'CLOSED')),
            currency TEXT DEFAULT 'INR' NOT NULL,
            balance REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_accounts_user_status ON accounts(user_id, status);

        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_account_id INTEGER NOT NULL,
            to_account_id INTEGER NOT NULL,
            amount REAL NOT NULL CHECK(amount >= 0),
            idempotency_key TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED')),
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (from_account_id) REFERENCES accounts(id),
            FOREIGN KEY (to_account_id) REFERENCES accounts(id)
        );

        CREATE INDEX IF NOT EXISTS idx_transactions_idempotency_key ON transactions(idempotency_key);

        CREATE TABLE IF NOT EXISTS ledger_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            transaction_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            type TEXT CHECK(type IN ('CREDIT', 'DEBIT')) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (account_id) REFERENCES accounts(id),
            FOREIGN KEY (transaction_id) REFERENCES transactions(id)
        );

        CREATE INDEX IF NOT EXISTS idx_ledger_account ON ledger_entries(account_id);
        CREATE INDEX IF NOT EXISTS idx_ledger_transaction ON ledger_entries(transaction_id);

        CREATE TABLE IF NOT EXISTS token_blacklist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Triggers for ledger immutability
        CREATE TRIGGER IF NOT EXISTS prevent_ledger_update
        BEFORE UPDATE ON ledger_entries
        BEGIN
            SELECT RAISE(FAIL, 'Ledger entries are immutable');
        END;

        CREATE TRIGGER IF NOT EXISTS prevent_ledger_delete
        BEFORE DELETE ON ledger_entries
        BEGIN
            SELECT RAISE(FAIL, 'Ledger entries are immutable');
        END;
    `;

    db.exec(schema);
    console.log("Migrations applied successfully.");
}

module.exports = runMigrations;
