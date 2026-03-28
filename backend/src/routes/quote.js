import express from "express"
import { body } from "express-validator"
import { authMiddleware } from "../middleware/auth.js"
import { demoGuard } from "../middleware/demoGuard.js"
import { validateRequest } from "../middleware/validator.js"
import { requirePermission } from "../middleware/permissions.js"
import {
    getQuotes,
    getQuoteById,
    createQuote,
    updateQuote,
    transitionQuoteStatus,
    deleteQuote,
} from "../controllers/quoteController.js"

const router = express.Router()

router.use(authMiddleware)
router.use(demoGuard)

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
        .withMessage("Invalid issue date format (expected YYYY-MM-DD)"),

    body("expiryDate")
        .exists({ checkFalsy: true })
        .withMessage("Expiry date is required")
        .isISO8601()
        .withMessage("Invalid expiry date format (expected YYYY-MM-DD)"),

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

    body("notes")
        .optional()
        .trim()
        .escape(),
]

const statusTransitionRules = [
    body("status")
        .notEmpty()
        .withMessage("Status is required")
        .isIn(["sent", "accepted", "declined", "expired"])
        .withMessage("Invalid status"),
]

router.post("/", requirePermission("quotes", "write"), quoteValidationRules, validateRequest, createQuote);
router.get("/", requirePermission("quotes", "read"), getQuotes);
router.get("/:id", requirePermission("quotes", "read"), getQuoteById);
router.put("/:id", requirePermission("quotes", "write"), quoteValidationRules, validateRequest, updateQuote);
router.patch("/:id/status", requirePermission("quotes", "write"), statusTransitionRules, validateRequest, transitionQuoteStatus);
router.delete("/:id", requirePermission("quotes", "write"), deleteQuote);

export default router;
