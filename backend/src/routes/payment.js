import express from "express"
import { body } from "express-validator"
import { authMiddleware } from "../middleware/auth.js"
import { demoGuard } from "../middleware/demoGuard.js"
import { validateRequest } from "../middleware/validator.js"
import { requirePermission } from "../middleware/permissions.js"
import {
    getPayments,
    getPaymentById,
    createPayment,
} from "../controllers/paymentController.js"

const router = express.Router()

router.use(authMiddleware)
router.use(demoGuard)

const paymentValidationRules = [
    body("invoice")
        .trim()
        .escape()
        .notEmpty()
        .withMessage("Invoice ID is required"),

    body("amount")
        .isNumeric()
        .withMessage("Payment amount must be a number")
        .custom(value => value > 0)
        .withMessage("Payment amount must be greater than 0"),

    body("paymentMethod")
        .trim()
        .escape()
        .notEmpty()
        .withMessage("Payment method is required")
        .isIn(["cash", "card", "bank_transfer", "paypal"])
        .withMessage("Invalid payment method"),

    body("paymentDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid payment date format (expected YYYY-MM-DD)"),

    body("dueDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid due date format (expected YYYY-MM-DD)"),

    body("notes")
        .optional()
        .trim()
        .escape()
]

router.post("/", requirePermission("payments", "write"), paymentValidationRules, validateRequest, createPayment);
router.get("/", requirePermission("payments", "read"), getPayments);
router.get("/:id", requirePermission("payments", "read"), getPaymentById);

// NOTE: Update and delete intentionally omitted to maintain financial integrity
// Payments should not be modified or deleted after creation

export default router;
