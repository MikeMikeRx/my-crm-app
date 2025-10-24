import express from "express"
import { authMiddleware } from "../middleware/auth.js"
import {
    getInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    deleteInvoice,
} from "../controllers/invoiceController.js"

const router = express.Router()

router.use(authMiddleware)

router.get("/", getInvoices)
router.get("/:id", getInvoiceById)
router.post("/", createInvoice)
router.put("/:id", updateInvoice)
router.delete("/:id", deleteInvoice)

export default router