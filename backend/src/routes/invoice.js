import express from "express"
import { authMiddleware } from "../middleware/auth"
import {
    getInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    deleteInvoice,
} from "../controllers/invoiceController"

const router = express.Router()

router.use(authMiddleware)

router.get("/", getInvoices)
router.get("/:id", getInvoiceById)
router.post("/", createInvoice)
router.put("/:id", updateInvoice)
router.delete("/:id", deleteInvoice)

export default router