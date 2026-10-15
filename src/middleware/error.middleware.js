/**
 * Centralized error handler.
 * Any controller can `throw` an ApiError (or a Mongoose error) and this
 * middleware turns it into a consistent JSON response without leaking
 * internals (stack traces, DB errors, secrets) to the client.
 */

class ApiError extends Error {
    constructor(statusCode, message) {
        super(message)
        this.statusCode = statusCode
    }
}

function notFoundHandler(req, res) {
    res.status(404).json({ message: "Route not found" })
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({ message: err.message })
    }

    if (err.name === "ValidationError") {
        const message = Object.values(err.errors).map((e) => e.message).join(", ")
        return res.status(400).json({ message })
    }

    if (err.code === 11000) {
        return res.status(409).json({ message: "Duplicate value, resource already exists" })
    }

    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
}

module.exports = { ApiError, notFoundHandler, errorHandler }
