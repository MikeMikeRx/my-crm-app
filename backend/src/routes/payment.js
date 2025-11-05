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

router.use(authMiddleware)

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
        .withMessage("Invalid payment date format (expected YYYY-MM-DD"),

    body("notes")
        .optional()
        .trim()
        .escape()        
]

router.post("/", paymentValidationRules, validateRequest, createPayment)
router.get("/", getPayments)
router.get("/:id", getPaymentById)

export default router