// Since we switched to SQLite, IDs are integers.
// Keep the name for compatibility but change the logic.
function isValidObjectId(id) {
    return !isNaN(id) && parseInt(id) > 0;
}

function isValidAmount(amount) {
    return typeof amount === "number" && Number.isFinite(amount) && amount > 0
}

function hasValidPrecision(amount) {
    return Number(amount.toFixed(2)) === amount
}

function normalizeAmount(amount) {
    return Math.round(amount * 100) / 100
}

function parsePagination(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20))
    return { page, limit, skip: (page - 1) * limit }
}

module.exports = { isValidObjectId, isValidAmount, hasValidPrecision, normalizeAmount, parsePagination }
