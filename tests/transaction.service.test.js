const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

// Use a separate database for integration tests
const dbPath = path.join(__dirname, "../data/ledger.test.db");
const productionDbPath = path.join(__dirname, "../data/ledger.db");

if (path.resolve(dbPath) === path.resolve(productionDbPath)) {
    throw new Error("Test database cannot be the production database");
}

process.env.DB_PATH = dbPath;

// Delete only the test database
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
}

const db = require("../src/db/database");
const runMigrations = require("../src/db/migrations");

if (path.resolve(db.name) !== path.resolve(dbPath)) {
    throw new Error("Database isolation failed. Tests stopped.");
}

runMigrations();

const userModel = require("../src/models/user.model");
const accountModel = require("../src/models/account.model");
const transactionModel = require("../src/models/transaction.model");
const ledgerModel = require("../src/models/ledger.model");
const {
    transfer,
    reverseTransaction
} = require("../src/services/transaction.service");

test("transaction.service integration suite", async (t) => {
    let userA, userB, accountA, accountB;

    async function resetAndSeed() {
        // Clear test database tables
        db.prepare("DROP TRIGGER IF EXISTS prevent_ledger_update").run();
        db.prepare("DROP TRIGGER IF EXISTS prevent_ledger_delete").run();

        db.prepare("DELETE FROM ledger_entries").run();
        db.prepare("DELETE FROM transactions").run();
        db.prepare("DELETE FROM accounts").run();
        db.prepare("DELETE FROM users").run();

        // Restore ledger immutability triggers
        db.exec(`
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
        `);

        userA = await userModel.createUser({
            email: "a@test.com",
            password: "password1",
            name: "A"
        });

        userB = await userModel.createUser({
            email: "b@test.com",
            password: "password1",
            name: "B"
        });

        accountA = await accountModel.createAccount(userA.id);
        accountB = await accountModel.createAccount(userB.id);

        // Balanced test funding
        // Account B is an artificial funding source
        const seedKey = `seed-${Date.now()}`;

        const seedTxn = await transactionModel.createTransaction({
            from_account_id: accountB.id,
            to_account_id: accountA.id,
            amount: 1000,
            idempotency_key: seedKey,
            status: "COMPLETED"
        });

        // Debit funding account
        await ledgerModel.createLedgerEntry({
            account_id: accountB.id,
            transaction_id: seedTxn.id,
            amount: 1000,
            type: "DEBIT"
        });

        // Credit receiving account
        await ledgerModel.createLedgerEntry({
            account_id: accountA.id,
            transaction_id: seedTxn.id,
            amount: 1000,
            type: "CREDIT"
        });

        db.prepare(
            "UPDATE accounts SET balance = balance - 1000 WHERE id = ?"
        ).run(accountB.id);

        db.prepare(
            "UPDATE accounts SET balance = balance + 1000 WHERE id = ?"
        ).run(accountA.id);

        accountA = await accountModel.findAccountById(accountA.id);
        accountB = await accountModel.findAccountById(accountB.id);

        assert.equal(accountA.balance, 1000);
        assert.equal(accountB.balance, -1000);

        const entries = await ledgerModel.getLedgerByTransactionId(seedTxn.id);
        assert.equal(entries.length, 2);
    }

    await t.test(
        "rejects a transfer from an account the user does not own",
        async () => {
            await resetAndSeed();

            await assert.rejects(
                transfer({
                    userId: userB.id,
                    fromAccount: accountA.id,
                    toAccount: accountB.id,
                    amount: 100,
                    idempotencyKey: "own-check-1"
                }),
                /does not belong to the authenticated user/
            );
        }
    );

    await t.test(
        "rejects a transfer that exceeds the sender's balance",
        async () => {
            await resetAndSeed();

            await assert.rejects(
                transfer({
                    userId: userA.id,
                    fromAccount: accountA.id,
                    toAccount: accountB.id,
                    amount: 5000,
                    idempotencyKey: "balance-check-1"
                }),
                /Insufficient balance/
            );
        }
    );

    await t.test(
        "is idempotent: replaying the same key returns the original transaction",
        async () => {
            await resetAndSeed();

            const key = "idem-check-1";

            const first = await transfer({
                userId: userA.id,
                fromAccount: accountA.id,
                toAccount: accountB.id,
                amount: 100,
                idempotencyKey: key
            });

            const second = await transfer({
                userId: userA.id,
                fromAccount: accountA.id,
                toAccount: accountB.id,
                amount: 100,
                idempotencyKey: key
            });

            assert.equal(
                String(first.transaction.id),
                String(second.transaction.id)
            );

            assert.equal(second.transaction.status, "COMPLETED");

            const ledgerCount = db.prepare(
                "SELECT COUNT(*) AS count FROM ledger_entries WHERE transaction_id = ?"
            ).get(first.transaction.id).count;

            assert.equal(ledgerCount, 2);
        }
    );

    await t.test(
        "a failed transaction persists a FAILED record with zero financial side effects",
        async () => {
            await resetAndSeed();

            const key = "fail-check-1";

            await assert.rejects(
                transfer({
                    userId: userA.id,
                    fromAccount: accountA.id,
                    toAccount: accountB.id,
                    amount: 5000,
                    idempotencyKey: key
                }),
                /Insufficient balance/
            );

            const persisted =
                await transactionModel.findTransactionByIdempotencyKey(key);

            assert.ok(
                persisted,
                "expected the claimed transaction document to still exist"
            );

            assert.equal(persisted.status, "FAILED");

            const ledgerCount = db.prepare(
                "SELECT COUNT(*) AS count FROM ledger_entries WHERE transaction_id = ?"
            ).get(persisted.id).count;

            assert.equal(ledgerCount, 0);

            const updatedAccount =
                await accountModel.findAccountById(accountA.id);

            assert.equal(updatedAccount.balance, 1000);
        }
    );
});