import Payment from "../models/Payment.js"
import Invoice from "../models/Invoice.js"
import { asyncHandler } from "../utils/asyncHandler.js"

export const getPayments = asyncHandler(async (req, res) => {
    const payments = await Payment.find({ tenant: req.tenant.id })
        .populate({
            path: "invoice",
            select: "invoiceNumber status customer",
            populate: { path: "customer", select: "name company" },
        })
        .sort({ paymentDate: -1 })

    res.json(payments)
})

export const getPaymentById = asyncHandler(async (req, res) => {
    const payment = await Payment.findOne({ _id: req.params.id, tenant: req.tenant.id })
        .populate({
            path: "invoice",
            select: "invoiceNumber status customer",
            populate: { path: "customer", select: "name company" }
        })

    if (!payment) {
        return res.status(404).json({ message: "Payment not found" })
    }

    res.json(payment)
})

const PENDING_METHODS = ["bank_transfer", "card", "paypal"]

export const createPayment = asyncHandler(async (req, res) => {
    const { paymentId, invoice, amount, paymentDate, dueDate, paymentMethod, notes } = req.body

    if (!invoice || amount == null || !paymentMethod) {
        return res.status(400).json({ message: "Invoice, amount, and paymentMethod are required" })
    }

    if (Number(amount) <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" })
    }

    const existingInvoice = await Invoice.findOne({ _id: invoice, tenant: req.tenant.id })
    if (!existingInvoice) {
        return res.status(400).json({ message: "Invalid invoice ID" })
    }

    if (!["sent", "partially_paid"].includes(existingInvoice.status)) {
        return res.status(400).json({
            message: `Cannot add payment to an invoice with status "${existingInvoice.status}". Only sent or partially paid invoices can receive payments.`
        })
    }

    const completedPayments = await Payment.find({ invoice, status: "completed" });
    const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const invoiceTotal = existingInvoice.totals.total
    if (totalPaid + Number(amount) > invoiceTotal) {
        return res.status(400).json({
            message: `Payment would exceed invoice total. Remaining balance: ${(invoiceTotal - totalPaid).toFixed(2)}`
        });
    }

    const status = PENDING_METHODS.includes(paymentMethod) ? "pending" : "completed"

    const payment = await Payment.create({
        user: req.user.id,
        tenant: req.tenant.id,
        paymentId,
        invoice,
        amount,
        paymentMethod,
        paymentDate,
        dueDate: PENDING_METHODS.includes(paymentMethod) ? dueDate : undefined,
        status,
        notes,
    })

    if (status === "completed") {
        const allCompleted = await Payment.find({ invoice, status: "completed" });
        const newTotalPaid = allCompleted.reduce((sum, p) => sum + p.amount, 0);
        if (newTotalPaid >= existingInvoice.totals.total) {
            existingInvoice.status = "paid";
        } else {
            existingInvoice.status = "partially_paid";
        }
        await existingInvoice.save();
    }

    res.status(201).json(payment)
})
