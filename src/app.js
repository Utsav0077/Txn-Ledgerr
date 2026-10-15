const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware")

const app = express()

app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

/**
 * - Routes required
 */
const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")
const transactionRoutes = require("./routes/transaction.routes")
const healthRoutes = require("./routes/health.routes")

/**
 * - Use Routes
 */

app.get("/", (req, res) => {
    res.send("Ledger Service is up and running")
})

app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRoutes)
app.use("/api/health", healthRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app
