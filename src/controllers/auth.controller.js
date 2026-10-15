const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const emailService = require("../services/email.service")
const tokenBlackListModel = require("../models/blackList.model")
const { ApiError } = require("../middleware/error.middleware")

/**
* - user register controller
* - POST /api/auth/register
*/
async function userRegisterController(req, res, next) {
    try {
        const { email, password, name } = req.body

        if (!email || !password || !name) {
            throw new ApiError(400, "email, password and name are required")
        }

        const isExists = await userModel.findUserByEmail(email)

        if (isExists) {
            throw new ApiError(422, "User already exists with email.")
        }

        const user = await userModel.createUser({ email, password, name })

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "3d" })

        res.cookie("token", token)

        res.status(201).json({
            user: { _id: user.id, email: user.email, name: user.name },
            token
        })

        emailService.sendRegistrationEmail(user.email, user.name).catch((err) => console.error("Registration email failed:", err.message))
    } catch (error) {
        next(error)
    }
}

/**
 * - User Login Controller
 * - POST /api/auth/login
  */
async function userLoginController(req, res, next) {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            throw new ApiError(400, "email and password are required")
        }

        const user = await userModel.findUserByEmail(email)

        if (!user) {
            throw new ApiError(401, "Email or password is INVALID")
        }

        const isValidPassword = await userModel.comparePassword(password, user.password)

        if (!isValidPassword) {
            throw new ApiError(401, "Email or password is INVALID")
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "3d" })

        res.cookie("token", token)

        res.status(200).json({
            user: { _id: user.id, email: user.email, name: user.name },
            token
        })
    } catch (error) {
        next(error)
    }
}

/**
 * - User Logout Controller
 * - POST /api/auth/logout
  */
async function userLogoutController(req, res, next) {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

        if (!token) {
            return res.status(200).json({ message: "User logged out successfully" })
        }

        await tokenBlackListModel.addToken(token)

        res.clearCookie("token")

        res.status(200).json({ message: "User logged out successfully" })
    } catch (error) {
        next(error)
    }
}

/**
 * - Get Current User Controller
 * - GET /api/auth/me
 * - Lets the frontend restore a session after a page refresh.
 */
async function getCurrentUserController(req, res, next) {
    try {
        res.status(200).json({
            user: { _id: req.user.id, email: req.user.email, name: req.user.name }
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController,
    getCurrentUserController
}
