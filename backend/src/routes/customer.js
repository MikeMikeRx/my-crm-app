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

router.post(
    "/",
    [
        body("name").notEmpty().withMessage("Customer name is required"),
        body("email").optional().isEmail().withMessage("Invalid email format"),
        body("phone").optional().isString(),
    ],
    validateRequest,
    createCustomer
)

router.get("/", getCustomers)
router.get("/:id", getCustomerById)
router.put("/:id", updateCustomer)
router.delete("/:id", deleteCustomer)

export default router