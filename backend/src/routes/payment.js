import express from "express"
import { body } from "express-validator"
import { authMiddleware } from "../middleware/auth.js"
import { validateRequest } from "../middleware/validator.js"
import {
    getPayments,
    getPaymentById,
    createPayment,
} from "../controllers/paymentController.js"

const router = express.Router()

// ============================================================================
// PAYMENT ROUTES
// ============================================================================
// All routes require authentication (applied globally below)
// NOTE: Payments follow financial best practices:
// - CREATE: Record new payments
// - READ: View payment history
// - NO UPDATE: Payments should not be modified after creation
// - NO DELETE: Payments should not be deleted (audit trail integrity)

// Apply authentication to all payment routes
router.use(authMiddleware)

// ============================================================================
// VALIDATION RULES
// ============================================================================
// Validation rules for creating payments
const paymentValidationRules = [
    body("invoice")
        .trim()
        .escape() // Sanitize HTML
        .notEmpty()
        .withMessage("Invoice ID is required"),

    body("amount")
        .isNumeric()
        .withMessage("Payment amount must be a number")
        .custom(value => value > 0)
        .withMessage("Payment amount must be greater than 0"),

    body("paymentMethod")
        .trim()
        .escape() // Sanitize HTML
        .notEmpty()
        .withMessage("Payment method is required")
        .isIn(["cash", "card", "bank_transfer", "paypal"]) // Validate against allowed methods
        .withMessage("Invalid payment method"),

    body("paymentDate")
        .optional() // Payment date is optional (defaults to now)
        .isISO8601() // Validate ISO 8601 date format (YYYY-MM-DD)
        .withMessage("Invalid payment date format (expected YYYY-MM-DD)"),

    body("notes")
        .optional() // Notes are optional
        .trim()
        .escape() // Sanitize HTML
]

// ============================================================================
// ROUTES
// ============================================================================

// POST /api/payments
// Create a new payment against an invoice
// Requires: invoice, amount, paymentMethod
// Optional: paymentDate (defaults to current date), notes
// Returns: Created payment object
// Note: Automatically updates invoice status if fully paid
router.post("/", paymentValidationRules, validateRequest, createPayment)

// GET /api/payments
// Get all payments for authenticated user
// Returns: Array of payments with nested invoice and customer data
router.get("/", getPayments)

// GET /api/payments/:id
// Get a single payment by ID
// Returns: Payment object with nested invoice and customer data
router.get("/:id", getPaymentById)

// ============================================================================
// INTENTIONALLY OMITTED ROUTES
// ============================================================================
// PUT /api/payments/:id - Update payment
// DELETE /api/payments/:id - Delete payment
//
// These routes are intentionally not implemented to maintain financial integrity.
// In real-world accounting applications:
// - Payments should not be modified after creation
// - Payments should not be deleted (breaks audit trail)
// - Use refunds or adjustments instead of editing/deleting payments

export default router
