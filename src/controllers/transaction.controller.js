const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")
const transactionService = require("../services/transaction.service")
const { ApiError } = require("../middleware/error.middleware")
const { isValidObjectId, parsePagination } = require("../utils/validators")
const db = require("../db/database")

/**
 * POST /api/transactions
 * Create a new transaction (money movement between two accounts).
 * Ownership, balance, and idempotency logic lives in transaction.service.js.
 */
async function createTransaction(req, res, next) {
    try {
        const { fromAccount, toAccount, amount, idempotencyKey, description } = req.body

        const result = await transactionService.transfer({
            userId: req.user.id,
            fromAccount,
            toAccount,
            amount,
            description,
            idempotencyKey
        })

        if (result.statusCode === 201) {
            emailService
                .sendTransactionEmail(req.user.email, req.user.name, result.transaction.amount, toAccount)
                .catch((err) => console.error("Failed to send transaction email:", err.message))
        }

        return res.status(result.statusCode).json({ message: result.message, transaction: result.transaction })
    } catch (error) {
        return next(error)
    }
}

/**
 * POST /api/transactions/system/initial-funds
 * System-user-only: seed an account with funds from the system account.
 */
async function createInitialFundsTransaction(req, res, next) {
    try {
        const { toAccount, amount, idempotencyKey, description } = req.body

        const result = await transactionService.createInitialFunds({
            systemUserId: req.user.id,
            toAccount,
            amount,
            idempotencyKey,
            description
        })

        return res.status(result.statusCode).json({ message: result.message, transaction: result.transaction })
    } catch (error) {
        return next(error)
    }
}

/**
 * GET /api/transactions
 * Paginated history of transactions across all of the logged-in user's accounts.
 * Query params: page, limit, status, accountId
 */
async function listTransactions(req, res, next) {
    try {
        const { page, limit, skip } = parsePagination(req.query)
        const { status, accountId } = req.query

        const ownedAccounts = await accountModel.findAccountsByUserId(req.user.id)
        const ownedAccountIds = ownedAccounts.map((a) => a.id)

        if (accountId && !isValidObjectId(accountId)) {
            throw new ApiError(400, "Invalid accountId")
        }

        const accountFilter = accountId
            ? ownedAccountIds.filter((id) => String(id) === String(accountId))
            : ownedAccountIds

        if (accountId && accountFilter.length === 0) {
            throw new ApiError(403, "accountId does not belong to the authenticated user")
        }

        // SQLite query
        const placeHolders = accountFilter.map(() => "?").join(",");
        const query = `
            SELECT * FROM transactions
            WHERE (from_account_id IN (${placeHolders}) OR to_account_id IN (${placeHolders}))
            ${status ? "AND status = ?" : ""}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;
        const params = [...accountFilter, ...accountFilter];
        if (status) params.push(status);
        params.push(limit, skip);

        const transactions = db.prepare(query).all(...params);
        const total = db.prepare(`
            SELECT COUNT(*) as count FROM transactions
            WHERE (from_account_id IN (${placeHolders}) OR to_account_id IN (${placeHolders}))
            ${status ? "AND status = ?" : ""}
        `).get(...params.slice(0, -2)).count;

        return res.status(200).json({
            transactions,
            pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
        })
    } catch (error) {
        return next(error)
    }
}

/**
 * GET /api/transactions/:id
 * Full detail for a single transaction, including its ledger entries.
 * Only accessible to a participant (sender or receiver account owner).
 */
async function getTransactionById(req, res, next) {
    try {
        const { id } = req.params
        if (!isValidObjectId(id)) {
            throw new ApiError(400, "Invalid transaction id")
        }

        const transaction = await transactionModel.findTransactionById(id)
        if (!transaction) {
            throw new ApiError(404, "Transaction not found")
        }

        const fromAcc = await accountModel.findAccountById(transaction.from_account_id)
        const toAcc = await accountModel.findAccountById(transaction.to_account_id)

        const isParticipant =
            (fromAcc && String(fromAcc.user_id) === String(req.user.id)) ||
            (toAcc && String(toAcc.user_id) === String(req.user.id))

        if (!isParticipant) {
            throw new ApiError(403, "You are not a participant in this transaction")
        }

        const ledgerEntries = await ledgerModel.getLedgerByTransactionId(transaction.id)

        return res.status(200).json({ transaction, ledgerEntries })
    } catch (error) {
        return next(error)
    }
}

/**
 * POST /api/transactions/:id/reverse
 * Reverse a COMPLETED transaction via compensating ledger entries.
 */
async function reverseTransactionController(req, res, next) {
    try {
        const { id } = req.params
        if (!isValidObjectId(id)) {
            throw new ApiError(400, "Invalid transaction id")
        }

        const result = await transactionService.reverseTransaction({ userId: req.user.id, transactionId: id })
        return res.status(result.statusCode).json({ message: result.message, transaction: result.transaction })
    } catch (error) {
        return next(error)
    }
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction,
    listTransactions,
    getTransactionById,
    reverseTransactionController
}
