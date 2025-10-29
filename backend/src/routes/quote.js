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

router.use(authMiddleware)

const quoteValidationRules = [
    body("customer")
        .trim()
        .escape()
        .notEmpty()
        .withMessage("Customer ID is required"),

    body("quoteNumber")
        .trim()
        .escape()
        .notEmpty()
        .withMessage("Quote number is required"),

    body("issueDate")
        .notEmpty()
        .withMessage("Issue date is required")
        .isISO8601()
        .withMessage("Invalid issue date format (expected YYYY-MM-DD"),

    body("expiryDate")
        .notEmpty()
        .withMessage("Expiry date is required")
        .isISO8601()
        .withMessage("Invalid expiry date format (expected YYYY-MM-DD"),

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

router.post("/", quoteValidationRules, validateRequest, createQuote)
router.get("/", getQuotes)
router.get("/:id", getQuoteById)
router.put("/:id", quoteValidationRules, validateRequest, updateQuote)
router.delete("/:id", deleteQuote)

export default router