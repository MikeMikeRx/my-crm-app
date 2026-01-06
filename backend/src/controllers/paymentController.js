import Payment from "../models/Payment.js"
import Invoice from "../models/Invoice.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import dayjs from "dayjs"

// ============================================================================
// GET ALL PAYMENTS
// ============================================================================
export const getPayments = asyncHandler(async (req, res, next) => {
    // ========================================================================
    // FETCH PAYMENTS
    // ========================================================================
    // Find all payments belonging to the authenticated user
    // Populate invoice details (invoiceNumber, status, customer)
    // Nested populate: customer details (name, company)
    // Sort by payment date (newest first)
    const payments = await Payment.find({ user: req.user.id })
        .populate({
            path: "invoice",
            select: "invoiceNumber status customer",
            populate: { path: "customer", select: "name company" },
        })
        .sort({ paymentDate: -1 })

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.json(payments)
})

// ============================================================================
// GET PAYMENT BY ID
// ============================================================================
export const getPaymentById = asyncHandler(async (req, res, next) => {
    // ========================================================================
    // FETCH PAYMENT
    // ========================================================================
    // Find payment by ID, ensuring it belongs to the authenticated user
    // Populate invoice details (invoiceNumber, status, customer)
    // Nested populate: customer details (name, company)
    const payment = await Payment.findOne({ _id: req.params.id, user: req.user.id })
        .populate({
            path: "invoice",
            select: "invoiceNumber status customer",
            populate: { path: "customer", select: "name company" }
        })

    // Check if payment exists
    if (!payment) {
        return res.status(404).json({ message: "Payment not found" })
    }

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.json(payment)
})

// ============================================================================
// CREATE PAYMENT
// ============================================================================
export const createPayment = asyncHandler(async (req, res, next) => {
    // ========================================================================
    // EXTRACT & VALIDATE INPUT
    // ========================================================================
    const { paymentId, invoice, amount, paymentDate, paymentMethod, notes } = req.body

    // Ensure required fields are provided
    if (!invoice || amount == null || !paymentMethod) {
        return res.status(400).json({ message: "Invoice, amount, and paymentMethod are required" })
    }

    // Validate amount is positive
    if (Number(amount) <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" })
    }

    // ========================================================================
    // VALIDATE INVOICE
    // ========================================================================
    // Ensure invoice exists and belongs to the authenticated user
    const existingInvoice = await Invoice.findOne({ _id: invoice, user: req.user.id })
    if (!existingInvoice) {
        return res.status(400).json({ message: "Invalid invoice ID" })
    }

    // ========================================================================
    // CREATE PAYMENT
    // ========================================================================
    const payment = await Payment.create({
        user: req.user.id,
        paymentId,
        invoice,
        amount,
        paymentMethod,
        paymentDate,
        notes,
    })

    // ========================================================================
    // UPDATE INVOICE STATUS
    // ========================================================================
    // Calculate total amount paid for this invoice
    const payments = await Payment.find({ invoice });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate invoice total from items
    const invoiceTotal = existingInvoice.items.reduce(
        (sum, i) => sum + i.quantity * i.unitPrice,
        0
    );

    // Mark invoice as "paid" ONLY if fully paid
    if (totalPaid >= invoiceTotal) {
        existingInvoice.status = "paid"
        await existingInvoice.save();
    } else {
        // If not fully paid and past due date, mark as "overdue"
        if (dayjs(existingInvoice.dueDate).isBefore(dayjs(), "day")) {
            existingInvoice.status = "overdue";
            await existingInvoice.save();
        }
    }

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.status(201).json(payment)
})
