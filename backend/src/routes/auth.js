import express from "express"
import { body } from "express-validator"
import { registerUser, loginUser, getProfile } from "../controllers/authController.js"
import { authMiddleware } from "../middleware/auth.js"
import { authRateLimiter } from "../middleware/rateLimiter.js"
import { validateRequest } from "../middleware/validator.js"

const router = express.Router()

router.post(
    "/register",
    authRateLimiter,
    [
        body("name")
            .trim()
            .escape()
            .notEmpty()
            .withMessage("Name is required"),
        
        body("email")
            .trim()
            .normalizeEmail()
            .isEmail()
            .withMessage("Valid email is required"),

        body("password")
            .trim()
            .isLength({ min: 6 })
            .withMessage("Password must be at least 6 characters long")
    ],
    validateRequest,
    registerUser
)

router.post(
    "/login",
    authRateLimiter,
    [
        body("email")
            .trim()
            .normalizeEmail()
            .isEmail()
            .withMessage("Valid email is required"),

        body("password")
            .trim()
            .notEmpty()
            .withMessage("Password is required")
    ],
    validateRequest,
    loginUser
)

router.get("/profile", authMiddleware, getProfile)

export default router