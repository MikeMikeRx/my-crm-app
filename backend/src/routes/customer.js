import express from "express"
import { body } from "express-validator"
import { authMiddleware } from "../middleware/auth.js"
import { demoGuard } from "../middleware/demoGuard.js"
import { validateRequest } from "../middleware/validator.js"
import { requirePermission } from "../middleware/permissions.js"
import {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
} from "../controllers/customerController.js"

const router = express.Router()

router.use(authMiddleware)
router.use(demoGuard)

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

router.post("/", requirePermission("customers", "write"), customerValidationRules, validateRequest, createCustomer);
router.get("/", requirePermission("customers", "read"), getCustomers);
router.get("/:id", requirePermission("customers", "read"), getCustomerById);
router.put("/:id", requirePermission("customers", "write"), customerValidationRules, validateRequest, updateCustomer);
router.delete("/:id", requirePermission("customers", "write"), deleteCustomer);

export default router
