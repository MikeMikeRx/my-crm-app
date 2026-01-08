import express from "express"
import { body } from "express-validator"
import { authMiddleware } from "../middleware/auth.js"
import { validateRequest } from "../middleware/validator.js"
import {
    getQuotes,
    getQuoteById,
    createQuote,
    updateQuote,
    deleteQuote,
} from "../controllers/quoteController.js"

const router = express.Router()

// ============================================================================
// QUOTE ROUTES
// ============================================================================
// All routes require authentication (applied globally below)
// Full CRUD operations for quote management
// NOTE: Quotes can be edited/deleted (unlike invoices/payments) since they're
// pre-sale documents that haven't been converted to invoices yet

// Apply authentication to all quote routes
router.use(authMiddleware)

// ============================================================================
// VALIDATION RULES
// ============================================================================
// Shared validation rules for create and update operations
const quoteValidationRules = [
    body("customer")
        .trim()
        .escape() // Sanitize HTML
        .notEmpty()
        .withMessage("Customer ID is required"),

    body("quoteNumber")
        .trim()
        .escape() // Sanitize HTML
        .notEmpty()
        .withMessage("Quote number is required"),

    body("issueDate")
        .notEmpty()
        .withMessage("Issue date is required")
        .isISO8601() // Validate ISO 8601 date format (YYYY-MM-DD)
        .withMessage("Invalid issue date format (expected YYYY-MM-DD)"),

    body("expiryDate")
        .exists({ checkFalsy: true }) // Must exist and not be falsy
        .withMessage("Expiry date is required")
        .isISO8601() // Validate ISO 8601 date format (YYYY-MM-DD)
        .withMessage("Invalid expiry date format (expected YYYY-MM-DD)"),

    // Line Items Array Validation
    body("items")
        .isArray({ min: 1 })
        .withMessage("At least one item is required"),

    body("items.*.description")
        .trim()
        .escape() // Sanitize HTML
        .notEmpty()
        .withMessage("Item description is required"),

    body("items.*.quantity")
        .isNumeric()
        .withMessage("Quantity must be a number")
        .custom(value => value > 0)
        .withMessage("Quantity must be greater than 0"),

    body("items.*.unitPrice")
        .isNumeric()
        .withMessage("Unit price must be a number")
        .custom(value => value >= 0)
        .withMessage("Unit price must be non-negative"),

    body("items.*.taxRate")
        .optional() // Tax rate is optional (defaults to 20%)
        .isNumeric()
        .custom(value => value >= 0 && value <= 100)
        .withMessage("Tax rate must be between 0 and 100"),

    body("status")
        .optional() // Status is optional (defaults to "draft")
        .isIn(["draft", "sent", "accepted", "declined", "expired", "converted"]) // Validate quote lifecycle
        .withMessage("Invalid status"),

    body("notes")
        .optional() // Notes are optional
        .trim()
        .escape(), // Sanitize HTML
]

// ============================================================================
// ROUTES
// ============================================================================

// POST /api/quotes
// Create a new quote
// Requires: customer, quoteNumber, issueDate, expiryDate, items[]
// Optional: status (defaults to "draft"), notes
// Returns: Created quote with calculated totals
router.post("/", quoteValidationRules, validateRequest, createQuote)

// GET /api/quotes
// Get all quotes for authenticated user
// Returns: Array of quotes with auto-calculated expired status
router.get("/", getQuotes)

// GET /api/quotes/:id
// Get a single quote by ID
// Returns: Quote object with auto-calculated expired status
router.get("/:id", getQuoteById)

// PUT /api/quotes/:id
// Update an existing quote
// Requires: Same validation as create
// Returns: Updated quote with calculated totals
// Note: Quotes can be updated (unlike invoices) since they're pre-sale documents
router.put("/:id", quoteValidationRules, validateRequest, updateQuote)

// DELETE /api/quotes/:id
// Delete a quote
// Returns: Success message
// Note: Quotes can be deleted (unlike invoices/payments) since they're pre-sale documents
router.delete("/:id", deleteQuote)

export default router
