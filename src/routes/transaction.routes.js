const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const transactionController = require("../controllers/transaction.controller")

const transactionRoutes = Router();

/**
 * - POST /api/transactions/
 * - Create a new transaction
 */
transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)

/**
 * - GET /api/transactions/
 * - Paginated history for the logged-in user's accounts
 * - Query: page, limit, status, accountId
 */
transactionRoutes.get("/", authMiddleware.authMiddleware, transactionController.listTransactions)

/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user
 * NOTE: must be registered before "/:id" so "system" isn't parsed as an id
 */
transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)

/**
 * - GET /api/transactions/:id
 * - Full detail + ledger entries for one transaction
 */
transactionRoutes.get("/:id", authMiddleware.authMiddleware, transactionController.getTransactionById)

/**
 * - POST /api/transactions/:id/reverse
 * - Reverse a COMPLETED transaction via compensating ledger entries
 */
transactionRoutes.post("/:id/reverse", authMiddleware.authMiddleware, transactionController.reverseTransactionController)

module.exports = transactionRoutes;
