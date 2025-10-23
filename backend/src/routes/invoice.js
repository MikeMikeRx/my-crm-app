import express from "express"
import { authMiddleware } from "../middleware/auth"
import {
    getInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    deleteInvoice,
} from "../controllers/invoiceController"