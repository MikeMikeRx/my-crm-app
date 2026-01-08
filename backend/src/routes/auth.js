import express from "express"
import { body } from "express-validator"
import { registerUser, loginUser, getProfile } from "../controllers/authController.js"
import { authMiddleware } from "../middleware/auth.js"
import { authRateLimiter } from "../middleware/rateLimiter.js"
import { validateRequest } from "../middleware/validator.js"

const router = express.Router()

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================
// Handles user registration, login, and profile retrieval
// Register/Login: Protected by rate limiting (brute force prevention)
// Profile: Protected by authentication middleware

// ============================================================================
// POST /api/auth/register
// ============================================================================
// Register a new user account
// Middleware chain:
// 1. authRateLimiter - Rate limiting (10 attempts/min for testing)
// 2. Validation - Name, email, password validation
// 3. validateRequest - Process validation results
// 4. registerUser - Create user and return JWT token
router.post(
    "/register",
    authRateLimiter,
    [
        body("name")
            .trim()
            .escape() // Sanitize HTML
            .notEmpty()
            .withMessage("Name is required"),

        body("email")
            .trim()
            .normalizeEmail() // Normalize email format
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

// ============================================================================
// POST /api/auth/login
// ============================================================================
// Login with existing user credentials
// Middleware chain:
// 1. authRateLimiter - Rate limiting (10 attempts/min for testing)
// 2. Validation - Email and password validation
// 3. validateRequest - Process validation results
// 4. loginUser - Verify credentials and return JWT token
router.post(
    "/login",
    authRateLimiter,
    [
        body("email")
            .trim()
            .normalizeEmail() // Normalize email format
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

// ============================================================================
// GET /api/auth/profile
// ============================================================================
// Get authenticated user's profile information
// Requires: JWT token in Authorization header (Bearer token)
// Returns: User details (excludes password)
router.get("/profile", authMiddleware, getProfile)

export default router
