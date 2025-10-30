import Invoice from "../models/Invoice.js"
import Customer from "../models/Customer.js"
import { asyncHandler } from "../utils/asyncHandler.js"

export const getInvoices = asyncHandler(async (req, res, next) => {
        const invoices = await Invoice.find({ user: req.user.id })
            .populate("customer", "name email company")
            .sort({ createdAt: -1 })
        
        const withTotals = invoices.map(inv => ({
            ...inv.toObject(),
            totals: inv.totals
        }))
        res.json(withTotals)
})

export const getInvoiceById = asyncHandler(async (req, res, next) => {
        const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user.id })
            .populate("customer", "name email company")
        if (!invoice) return res.status(404).json({ message: "Invoice not found"})
        
        res.json({
            ...invoice.toObject(),
            totals: invoice.totals
        })
})

export const createInvoice = asyncHandler(async (req, res, next) => {
        const { customer, invoiceNumber, issueDate, dueDate, items, globalTaxRate, notes } = req.body

        const existingCustomer = await Customer.findOne({ _id: customer, user: req.user.id })
        if (!existingCustomer) return res.status(400).json({ message: "Invalid customer ID" })
        
        const newInvoice = await Invoice.create({
            user: req.user.id,
            customer,
            invoiceNumber,
            issueDate,
            dueDate,
            items,
            globalTaxRate,
            notes,
        })

        res.status(201).json({
            ...newInvoice.toObject(),
            totals: newInvoice.totals
        })
})

export const updateInvoice = asyncHandler(async (req, res, next) => {
        const invoice = await Invoice.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            req.body,
            { new: true, runValidators: true }
        )
        if (!invoice) return res.status(404).json({ message: "Invoice not found" })
        res.json({
            ...invoice.toObject(),
            totals: invoice.totals
        })
})

export const deleteInvoice = asyncHandler(async (req, res, next) => {
        const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, user: req.user.id })
        if (!invoice) return res.status(404).json({ message: "Invoice not found" })
        res.json({ message: "Invoice deleted successfully" })
})