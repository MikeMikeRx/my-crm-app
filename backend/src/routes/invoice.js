import express from "express"
import { body } from "express-validator"
import { authMiddleware } from "../middleware/auth.js"
import { validateRequest } from "../middleware/validator.js"
import {
    getInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    deleteInvoice,
} from "../controllers/invoiceController.js"

const router = express.Router()

// ============================================================================
// INVOICE ROUTES
// ============================================================================
// All routes require authentication (applied globally below)
// Standard CRUD operations for invoice management
// NOTE: All invoices must be created from quotes (quote field is required)

// Apply authentication to all invoice routes
router.use(authMiddleware)

// ============================================================================
// VALIDATION RULES
// ============================================================================
// Shared validation rules for create and update operations
const invoiceValidationRules = [
    body("customer")
        .trim()
        .escape() // Sanitize HTML
        .notEmpty()
        .withMessage("Customer ID is required"),

    body("quote")
        .trim()
        .escape() // Sanitize HTML
        .notEmpty()
        .withMessage("Quote ID is required"),

    body("invoiceNumber")
        .trim()
        .escape() // Sanitize HTML
        .notEmpty()
        .withMessage("Invoice number is required"),

    body("issueDate")
        .notEmpty()
        .withMessage("Issue date is required")
        .isISO8601() // Validate ISO 8601 date format (YYYY-MM-DD)
        .withMessage("Invalid issue date format (expected YYYY-MM-DD)"),

    body("dueDate")
        .notEmpty()
        .withMessage("Due date is required")
        .isISO8601() // Validate ISO 8601 date format (YYYY-MM-DD)
        .withMessage("Invalid due date format (expected YYYY-MM-DD)"),

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

    body("notes")
        .optional() // Notes are optional
        .trim()
        .escape(), // Sanitize HTML
]

// ============================================================================
// ROUTES
// ============================================================================

// POST /api/invoices
// Create a new invoice from a quote
// Requires: customer, quote, invoiceNumber, issueDate, dueDate, items[]
// Returns: Created invoice with calculated totals
router.post("/", invoiceValidationRules, validateRequest, createInvoice)

// GET /api/invoices
// Get all invoices for authenticated user
// Returns: Array of invoices with auto-calculated overdue status
router.get("/", getInvoices)

// GET /api/invoices/:id
// Get a single invoice by ID
// Returns: Invoice object with auto-calculated overdue status
router.get("/:id", getInvoiceById)

// PUT /api/invoices/:id
// Update an existing invoice
// Requires: Same validation as create
// Returns: Updated invoice with calculated totals
router.put("/:id", invoiceValidationRules, validateRequest, updateInvoice)

// DELETE /api/invoices/:id
// Delete an invoice
// Returns: Success message
// NOTE: This endpoint is intentionally not exposed to maintain financial integrity
// In real-world accounting applications, invoices should not be deleted
// Consider implementing void/cancel functionality instead of delete
// router.delete("/:id", deleteInvoice)

export default router
