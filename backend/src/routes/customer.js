import express from "express"
import { body } from "express-validator"
import { authMiddleware } from "../middleware/auth.js"
import { validateRequest } from "../middleware/validator.js"
import {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
} from "../controllers/customerController.js"

const router = express.Router()

// ============================================================================
// CUSTOMER ROUTES
// ============================================================================
// All routes require authentication (applied globally below)
// Standard CRUD operations for customer management

// Apply authentication to all customer routes
router.use(authMiddleware)

// ============================================================================
// VALIDATION RULES
// ============================================================================
// Shared validation rules for create and update operations
const customerValidationRules = [
    body("name")
        .trim()
        .escape() // Sanitize HTML
        .notEmpty()
        .withMessage("Customer name is required"),

    body("email")
        .optional() // Email is optional
        .trim()
        .normalizeEmail() // Normalize email format
        .isEmail()
        .withMessage("Invalid email format"),

    body("phone")
        .optional() // Phone is optional
        .trim()
        .escape() // Sanitize HTML
        .isString()
        .withMessage("Phone must be a valid string"),

    body("company")
        .optional() // Company is optional
        .trim()
        .escape() // Sanitize HTML
        .isString()
        .withMessage("Company must be a string"),

    body("address")
        .optional() // Address is optional
        .trim()
        .escape() // Sanitize HTML
        .isString()
        .withMessage("Address must be a string")
]

// ============================================================================
// ROUTES
// ============================================================================

// POST /api/customers
// Create a new customer
// Requires: name (required), email, phone, company, address (all optional)
router.post("/", customerValidationRules, validateRequest, createCustomer)

// GET /api/customers
// Get all customers for authenticated user
// Returns: Array of customer objects sorted by creation date (newest first)
router.get("/", getCustomers)

// GET /api/customers/:id
// Get a single customer by ID
// Returns: Customer object if found and belongs to authenticated user
router.get("/:id", getCustomerById)

// PUT /api/customers/:id
// Update an existing customer
// Requires: Same validation as create
// Returns: Updated customer object
router.put("/:id", customerValidationRules, validateRequest, updateCustomer)

// DELETE /api/customers/:id
// Delete a customer
// Returns: Success message
router.delete("/:id", deleteCustomer)

export default router
