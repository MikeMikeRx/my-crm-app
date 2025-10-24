import express from "express"
import { authMiddleware } from "../middleware/auth.js"
import {
    getPayments,
    getPaymentById,
    createPayment,
    deletePayment,
} from "../controllers/paymentController"

const router = express.Router()

router.use(authMiddleware)

router.get("/", getPayments)
router.get("/:id", getPaymentById)
router.post("/", createPayment)
router.delete("/:id", deletePayment)

export default router