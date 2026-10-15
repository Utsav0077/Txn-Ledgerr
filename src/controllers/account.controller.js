const accountModel = require("../models/account.model");
const accountService = require("../services/account.service")
const { ApiError } = require("../middleware/error.middleware")
const { isValidObjectId } = require("../utils/validators")

async function createAccountController(req, res, next) {
    try {
        const user = req.user;

        const account = await accountModel.createAccount(user.id)

        res.status(201).json({
            account
        })
    } catch (error) {
        next(error)
    }
}

async function getUserAccountsController(req, res, next) {
    try {
        const accounts = await accountModel.findAccountsByUserId(req.user.id);

        const accountsWithSummary = await Promise.all(
            accounts.map(async (account) => ({
                account,
                summary: await accountService.getAccountSummary(account.id)
            }))
        )

        res.status(200).json({
            accounts: accountsWithSummary
        })
    } catch (error) {
        next(error)
    }
}

async function getAccountBalanceController(req, res, next) {
    try {
        const { accountId } = req.params;

        if (!isValidObjectId(accountId)) {
            throw new ApiError(400, "Invalid accountId")
        }

        const account = await accountModel.findAccountById(accountId)

        if (!account || account.user_id !== req.user.id) {
            throw new ApiError(404, "Account not found")
        }

        const summary = await accountService.getAccountSummary(account.id)

        res.status(200).json({
            accountId: account.id,
            balance: summary.balance
        })
    } catch (error) {
        next(error)
    }
}

/**
 * GET /api/accounts/:accountId
 * Full detail (account fields + derived summary) for one owned account.
 */
async function getAccountDetailController(req, res, next) {
    try {
        const { accountId } = req.params;

        if (!isValidObjectId(accountId)) {
            throw new ApiError(400, "Invalid accountId")
        }

        const account = await accountService.getOwnedAccountOrThrow(accountId, req.user.id)
        const summary = await accountService.getAccountSummary(account.id)

        res.status(200).json({ account, summary })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController,
    getAccountDetailController
}
