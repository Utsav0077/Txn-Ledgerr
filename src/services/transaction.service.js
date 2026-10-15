const transactionModel = require("../models/transaction.model");
const accountModel = require("../models/account.model");
const { ApiError } = require("../middleware/error.middleware");
const {
    isValidAmount,
    hasValidPrecision,
    normalizeAmount
} = require("../utils/validators");
const db = require("../db/database");

function atomicDebit(accountId, amount, { allowNegative = false } = {}) {
    const sql = `
        UPDATE accounts
        SET balance = balance - ?
        WHERE id = ?
        ${allowNegative ? "" : "AND balance >= ?"}
    `;

    const stmt = db.prepare(sql);

    const info = allowNegative
        ? stmt.run(amount, accountId)
        : stmt.run(amount, accountId, amount);

    if (info.changes !== 1) {
        throw new ApiError(
            400,
            "Insufficient balance or invalid account"
        );
    }
}

function atomicCredit(accountId, amount) {
    const info = db.prepare(`
        UPDATE accounts
        SET balance = balance + ?
        WHERE id = ?
    `).run(amount, accountId);

    if (info.changes !== 1) {
        throw new ApiError(400, "Invalid account");
    }
}

function createLedgerEntrySync(data) {
    return db.prepare(`
        INSERT INTO ledger_entries
        (account_id, transaction_id, amount, type)
        VALUES (?, ?, ?, ?)
    `).run(
        data.account_id,
        data.transaction_id,
        data.amount,
        data.type
    );
}

function updateTransactionStatusSync(id, status) {
    const info = db.prepare(`
        UPDATE transactions
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(status, id);

    if (info.changes !== 1) {
        throw new Error("Transaction status update failed");
    }
}

function findTransactionSync(id) {
    return db.prepare(
        "SELECT * FROM transactions WHERE id = ?"
    ).get(id);
}

function respondToExistingTransaction(existing) {
    if (existing.status === "COMPLETED") {
        return {
            statusCode: 200,
            message: "Transaction already processed",
            transaction: existing
        };
    }

    if (existing.status === "PENDING") {
        return {
            statusCode: 200,
            message: "Transaction is still processing",
            transaction: existing
        };
    }

    if (existing.status === "FAILED") {
        throw new ApiError(
            409,
            "A previous transaction with this idempotency key failed, please retry with a new key"
        );
    }

    if (existing.status === "REVERSED") {
        throw new ApiError(
            409,
            "Transaction was reversed, please retry with a new idempotency key"
        );
    }

    throw new ApiError(
        409,
        "Transaction already exists under this idempotency key"
    );
}

async function claimIdempotencyKey(payload) {
    try {
        const transaction =
            await transactionModel.createTransaction(payload);

        return { claimed: true, transaction };
    } catch (error) {
        if (
            error.code === "SQLITE_CONSTRAINT_UNIQUE" ||
            error.code === "SQLITE_CONSTRAINT"
        ) {
            const existing =
                await transactionModel.findTransactionByIdempotencyKey(
                    payload.idempotency_key
                );

            if (existing) {
                return {
                    claimed: false,
                    transaction: existing
                };
            }
        }

        throw error;
    }
}

async function markFailed(transactionId) {
    await transactionModel.updateTransactionStatus(
        transactionId,
        "FAILED"
    );
}

function validateAmount(amount) {
    if (!isValidAmount(amount)) {
        throw new ApiError(
            400,
            "amount must be a positive number"
        );
    }

    if (!hasValidPrecision(amount)) {
        throw new ApiError(
            400,
            "amount cannot have more than 2 decimal places"
        );
    }

    return normalizeAmount(amount);
}

function executeAtomicTransfer({
    fromAccount,
    toAccount,
    amount,
    transactionId,
    reverseOriginalId = null,
    allowNegative = false
}) {
    return db.transaction(() => {
        atomicDebit(fromAccount, amount, { allowNegative });
        atomicCredit(toAccount, amount);

        createLedgerEntrySync({
            account_id: fromAccount,
            transaction_id: transactionId,
            amount,
            type: "DEBIT"
        });

        createLedgerEntrySync({
            account_id: toAccount,
            transaction_id: transactionId,
            amount,
            type: "CREDIT"
        });

        updateTransactionStatusSync(transactionId, "COMPLETED");

        if (reverseOriginalId !== null) {
            updateTransactionStatusSync(
                reverseOriginalId,
                "REVERSED"
            );
        }

        const transaction = findTransactionSync(transactionId);

        if (!transaction) {
            throw new Error("Completed transaction not found");
        }

        return transaction;
    })();
}

async function transfer({
    userId,
    fromAccount,
    toAccount,
    amount,
    description,
    idempotencyKey
}) {
    if (
        !fromAccount ||
        !toAccount ||
        amount === undefined ||
        amount === null ||
        !idempotencyKey
    ) {
        throw new ApiError(
            400,
            "fromAccount, toAccount, amount and idempotencyKey are required"
        );
    }

    const normalizedAmount = validateAmount(amount);

    if (String(fromAccount) === String(toAccount)) {
        throw new ApiError(
            400,
            "fromAccount and toAccount cannot be the same account"
        );
    }

    const existing =
        await transactionModel.findTransactionByIdempotencyKey(
            idempotencyKey
        );

    if (existing) {
        return respondToExistingTransaction(existing);
    }

    const fromUserAccount =
        await accountModel.findAccountById(fromAccount);

    const toUserAccount =
        await accountModel.findAccountById(toAccount);

    if (!fromUserAccount || !toUserAccount) {
        throw new ApiError(
            400,
            "Invalid fromAccount or toAccount"
        );
    }

    if (String(fromUserAccount.user_id) !== String(userId)) {
        throw new ApiError(
            403,
            "fromAccount does not belong to the authenticated user"
        );
    }

    if (
        fromUserAccount.status !== "ACTIVE" ||
        toUserAccount.status !== "ACTIVE"
    ) {
        throw new ApiError(
            400,
            "Both fromAccount and toAccount must be ACTIVE to process a transaction"
        );
    }

    if (fromUserAccount.currency !== toUserAccount.currency) {
        throw new ApiError(
            400,
            "Both accounts must use the same currency"
        );
    }

    const claim = await claimIdempotencyKey({
        from_account_id: fromAccount,
        to_account_id: toAccount,
        amount: normalizedAmount,
        description,
        idempotency_key: idempotencyKey,
        status: "PENDING"
    });

    if (!claim.claimed) {
        return respondToExistingTransaction(claim.transaction);
    }

    const pending = claim.transaction;
    let transaction;

    try {
        transaction = executeAtomicTransfer({
            fromAccount,
            toAccount,
            amount: normalizedAmount,
            transactionId: pending.id
        });
    } catch (error) {
        console.error("TRANSFER FAILED:", error);

        await markFailed(pending.id);

        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(
            400,
            "Transaction could not be completed, please retry"
        );
    }

    return {
        statusCode: 201,
        message: "Transaction completed successfully",
        transaction
    };
}

async function createInitialFunds({
    systemUserId,
    toAccount,
    amount,
    idempotencyKey,
    description
}) {
    if (
        !toAccount ||
        amount === undefined ||
        amount === null ||
        !idempotencyKey
    ) {
        throw new ApiError(
            400,
            "toAccount, amount and idempotencyKey are required"
        );
    }

    const normalizedAmount = validateAmount(amount);

    const existing =
        await transactionModel.findTransactionByIdempotencyKey(
            idempotencyKey
        );

    if (existing) {
        return respondToExistingTransaction(existing);
    }

    const toUserAccount =
        await accountModel.findAccountById(toAccount);

    if (!toUserAccount) {
        throw new ApiError(400, "Invalid toAccount");
    }

    if (toUserAccount.status !== "ACTIVE") {
        throw new ApiError(400, "Destination account must be ACTIVE");
    }

    const systemAccount = db.prepare(`
        SELECT a.*
        FROM accounts a
        JOIN users u ON a.user_id = u.id
        WHERE u.system_user = 1
        LIMIT 1
    `).get();

    if (!systemAccount) {
        throw new ApiError(
            400,
            "System user account not found"
        );
    }

    if (systemAccount.status !== "ACTIVE") {
        throw new ApiError(
            400,
            "System account must be ACTIVE"
        );
    }

    if (systemAccount.currency !== toUserAccount.currency) {
        throw new ApiError(
            400,
            "Both accounts must use the same currency"
        );
    }

    if (String(systemAccount.id) === String(toAccount)) {
        throw new ApiError(
            400,
            "System account cannot fund itself"
        );
    }

    const claim = await claimIdempotencyKey({
        from_account_id: systemAccount.id,
        to_account_id: toAccount,
        amount: normalizedAmount,
        description,
        idempotency_key: idempotencyKey,
        status: "PENDING"
    });

    if (!claim.claimed) {
        return respondToExistingTransaction(claim.transaction);
    }

    const pending = claim.transaction;
    let transaction;

    try {
        transaction = executeAtomicTransfer({
            fromAccount: systemAccount.id,
            toAccount,
            amount: normalizedAmount,
            transactionId: pending.id,
            allowNegative: true
        });
    } catch (error) {
        console.error("INITIAL FUNDS FAILED:", error);

        await markFailed(pending.id);

        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(
            400,
            "Initial funds transaction could not be completed"
        );
    }

    return {
        statusCode: 201,
        message: "Initial funds transaction completed successfully",
        transaction
    };
}

async function reverseTransaction({
    userId,
    transactionId
}) {
    const original =
        await transactionModel.findTransactionById(transactionId);

    if (!original) {
        throw new ApiError(404, "Transaction not found");
    }

    if (original.status !== "COMPLETED") {
        throw new ApiError(
            400,
            `Only COMPLETED transactions can be reversed (current status: ${original.status})`
        );
    }

    const fromUserAccount =
        await accountModel.findAccountById(
            original.from_account_id
        );

    if (
        !fromUserAccount ||
        String(fromUserAccount.user_id) !== String(userId)
    ) {
        throw new ApiError(
            403,
            "Only the sender of the original transaction can reverse it"
        );
    }

    const reversalIdempotencyKey = `reversal:${original.id}`;

    const existingReversal =
        await transactionModel.findTransactionByIdempotencyKey(
            reversalIdempotencyKey
        );

    if (existingReversal) {
        return respondToExistingTransaction(existingReversal);
    }

    const claim = await claimIdempotencyKey({
        from_account_id: original.to_account_id,
        to_account_id: original.from_account_id,
        amount: original.amount,
        description: `Reversal of transaction ${original.id}`,
        idempotency_key: reversalIdempotencyKey,
        status: "PENDING"
    });

    if (!claim.claimed) {
        return respondToExistingTransaction(claim.transaction);
    }

    const pending = claim.transaction;
    let reversal;

    try {
        reversal = executeAtomicTransfer({
            fromAccount: original.to_account_id,
            toAccount: original.from_account_id,
            amount: original.amount,
            transactionId: pending.id,
            reverseOriginalId: original.id
        });
    } catch (error) {
        console.error("REVERSAL FAILED:", error);

        await markFailed(pending.id);

        if (
            error instanceof ApiError &&
            error.statusCode === 400 &&
            error.message === "Insufficient balance or invalid account"
        ) {
            throw new ApiError(
                400,
                "Cannot reverse: the receiver no longer has sufficient balance to return these funds"
            );
        }

        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(
            400,
            "Reversal could not be completed, please retry"
        );
    }

    return {
        statusCode: 201,
        message: "Transaction reversed successfully",
        transaction: reversal
    };
}

module.exports = {
    transfer,
    createInitialFunds,
    reverseTransaction,
    atomicDebit,
    atomicCredit
};