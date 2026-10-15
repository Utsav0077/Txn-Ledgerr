const accountModel = require("../models/account.model")
const ledgerModel = require("../models/ledger.model")
const { ApiError } = require("../middleware/error.middleware")

async function getOwnedAccountOrThrow(accountId, userId) {
    const account = await accountModel.findAccountById(accountId)
    if (!account || String(account.user_id) !== String(userId)) {
        throw new ApiError(404, "Account not found")
    }
    return account
}

async function getAccountSummary(accountId) {
    const totals = await ledgerModel.getAccountTotals(accountId);

    if (!totals || totals.transactionCount === 0) {
        return { balance: 0, totalCredit: 0, totalDebit: 0, transactionCount: 0 }
    }

    return {
        balance: totals.totalCredit - totals.totalDebit,
        totalCredit: totals.totalCredit,
        totalDebit: totals.totalDebit,
        transactionCount: totals.transactionCount
    }
}

module.exports = { getOwnedAccountOrThrow, getAccountSummary }
