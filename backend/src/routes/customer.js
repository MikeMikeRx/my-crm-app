import express from "express"
import { authMiddleware } from "../middleware/auth.js"
import {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
} from "../controllers/customerController.js"

const router = express.Router()

router.use(authMiddleware)

router.get("/", getCustomers)
router.get("/:id", getCustomerById)
router.post("/", createCustomer)
router.put("/:id", updateCustomer)
router.delete("/:id", deleteCustomer)

export default router