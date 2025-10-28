import express from "express"
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
    body("customer").notEmpty().withMessage("Customer ID is required"),
    body("invoiceNumber").notEmpty().withMessage("Invoice number is required"),
    body("issueDate").isISO8601().withMessage("Valid issue date is required"),
    body("dueDate").isISO8601().withMessage("Valid due date is required"),
    body("items")
        .isArray({ min: 1 })
        .withMessage("At least one item is required"),
    body("items.*.description")
        .notEmpty()
        .withMessage("Item description is required"),
    body("items.*.quantity")
        .isNumeric()
        .withMessage("Quantity must be a number")
        .custom(value => value >= 0)
        .withMessage("Quantity must be greater than 0"),
    body("items.*.unitPrice")
        .isNumeric()
        .withMessage("Unit price must be a number")
        .custom(value => value >= 0)
        .withMessage("Unit price must be non-negative"),
    body("globalTaxRate")
        .optional()
        .isNumeric()
        .withMessage("Global tax rate must be a number")
        .custom(value => value >= 0 && value <= 100)
        .withMessage("Tax rate must be between 0 and 100"),
]

router.post("/", invoiceValidationRules, validateRequest, createInvoice)
router.get("/", getInvoices)
router.get("/:id", getInvoiceById)
router.put("/:id", invoiceValidationRules, validateRequest, updateInvoice)
router.delete("/:id", deleteInvoice)

export default router