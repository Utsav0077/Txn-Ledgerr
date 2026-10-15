const { test } = require("node:test")
const assert = require("node:assert/strict")
const { isValidAmount, normalizeAmount, parsePagination, hasValidPrecision } = require("../src/utils/validators")

test("isValidAmount rejects zero, negative, NaN and non-numbers", () => {
    assert.equal(isValidAmount(0), false)
    assert.equal(isValidAmount(-10), false)
    assert.equal(isValidAmount(NaN), false)
    assert.equal(isValidAmount("100"), false)
    assert.equal(isValidAmount(Infinity), false)
})

test("isValidAmount accepts positive finite numbers", () => {
    assert.equal(isValidAmount(1), true)
    assert.equal(isValidAmount(0.5), true)
    assert.equal(isValidAmount(9999.99), true)
})

test("normalizeAmount rounds floating point drift to 2 decimals", () => {
    assert.equal(normalizeAmount(0.1 + 0.2), 0.3)
    assert.equal(normalizeAmount(10.001), 10)
    assert.equal(normalizeAmount(10.0049), 10)
})

test("parsePagination applies sane defaults and caps", () => {
    assert.deepEqual(parsePagination({}), { page: 1, limit: 20, skip: 0 })
    assert.deepEqual(parsePagination({ page: "3", limit: "10" }), { page: 3, limit: 10, skip: 20 })
    assert.deepEqual(parsePagination({ page: "-5", limit: "9999" }).limit, 100)
    assert.deepEqual(parsePagination({ page: "-5" }).page, 1)
})

test("hasValidPrecision accepts whole numbers and 2-decimal amounts", () => {
    assert.equal(hasValidPrecision(100), true)
    assert.equal(hasValidPrecision(99.9), true)
    assert.equal(hasValidPrecision(99.99), true)
})

test("hasValidPrecision rejects more than 2 decimal places", () => {
    assert.equal(hasValidPrecision(10.005), false)
    assert.equal(hasValidPrecision(10.001), false)
    assert.equal(hasValidPrecision(0.001), false)
})
