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

router.use(authMiddleware)

const invoiceValidationRules = [
    body("customer")
        .trim()
        .escape()
        .notEmpty()
        .withMessage("Customer ID is required"),

    body("invoiceNumber")
        .trim()
        .escape()
        .notEmpty()
        .withMessage("Invoice number is required"),

    body("issueDate")
        .notEmpty()
        .withMessage("Issue date is required")
        .isISO8601()
        .withMessage("Invalid issue date format (expected YYYY-MM-DD"),

    body("dueDate")
        .notEmpty()
        .withMessage("Due date is required")
        .isISO8601()
        .withMessage("Invalid due date format (expected YYYY-MM-DD"),

    body("items")
        .isArray({ min: 1 })
        .withMessage("At least one item is required"),

    body("items.*.description")
        .trim()
        .escape()
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
        .optional()
        .isNumeric()
        .custom(value => value >= 0 && value <= 100)
        .withMessage("Tax rate must be between 0 and 100"),

    body("globalTaxRate")
        .optional()
        .isNumeric()
        .custom(value => value >= 0 && value <= 100)
        .withMessage("Tax rate must be between 0 and 100"),

    body("notes")
        .optional()
        .trim()
        .escape(),
]

router.post("/", invoiceValidationRules, validateRequest, createInvoice)
router.get("/", getInvoices)
router.get("/:id", getInvoiceById)
router.put("/:id", invoiceValidationRules, validateRequest, updateInvoice)
router.delete("/:id", deleteInvoice)

export default router