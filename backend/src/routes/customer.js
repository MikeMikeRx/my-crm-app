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

router.use(authMiddleware)
   
const customerValidationRules = [
    body("name")
        .trim()
        .escape()
        .notEmpty()
        .withMessage("Customer name is required"),

    body("email")
        .optional()
        .trim()
        .normalizeEmail()
        .isEmail()
        .withMessage("Invalid email format"),

    body("phone")
        .optional()
        .trim()
        .escape()
        .isString()
        .withMessage("Phone must be a valid string"),

    body("company")
        .optional()
        .trim()
        .escape()
        .isString()
        .withMessage("Company must be a string"),

    body("address")
        .optional()
        .trim()
        .escape()
        .isString()
        .withMessage("Address must be a string")
]

router.post("/", customerValidationRules, validateRequest, createCustomer)
router.get("/", getCustomers)
router.get("/:id", getCustomerById)
router.put("/:id", customerValidationRules, validateRequest, updateCustomer)
router.delete("/:id", deleteCustomer)

export default router