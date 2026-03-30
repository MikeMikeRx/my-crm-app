import Payment from "../models/Payment.js"
import Invoice from "../models/Invoice.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { createActivity } from "../services/activity/createActivity.js"
import { parsePagination, paginatedResponse } from "../utils/pagination.js"
import { buildFilter } from "../utils/filters.js"
import mongoose from "mongoose"

const PAYMENT_STATUSES = new Set(["pending", "completed", "failed"])

export const getPayments = asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query)
    const { filter, errors } = buildFilter(
        { tenant: req.tenant.id },
        req.query,
        { validStatuses: PAYMENT_STATUSES, dateField: "paymentDate", allowCustomer: false }
    )

    if (errors.length) return res.status(400).json({ message: errors[0] })

    if (req.query.customer !== undefined) {
        if (!mongoose.isValidObjectId(req.query.customer)) {
            return res.status(400).json({ message: `Invalid customer ID: "${req.query.customer}"` })
        }
        const invoiceIds = await Invoice.find({ customer: req.query.customer, tenant: req.tenant.id }).distinct("_id")
        filter.invoice = { $in: invoiceIds }
    }

    const [payments, total] = await Promise.all([
        Payment.find(filter)
            .populate({
                path: "invoice",
                select: "invoiceNumber status customer",
                populate: { path: "customer", select: "name company" },
            })
            .sort({ paymentDate: -1 })
            .skip(skip)
            .limit(limit),
        Payment.countDocuments(filter),
    ])

    res.json(paginatedResponse(payments, total, page, limit))
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

    let invoiceBecamePaid = false;

    if (status === "completed") {
        const allCompleted = await Payment.find({ invoice, status: "completed" });
        const newTotalPaid = allCompleted.reduce((sum, p) => sum + p.amount, 0);
        if (newTotalPaid >= existingInvoice.totals.total) {
            existingInvoice.status = "paid";
            invoiceBecamePaid = true;
        } else {
            existingInvoice.status = "partially_paid";
        }
        await existingInvoice.save();
    }

    await createActivity({
        tenant: req.tenant.id,
        user: req.user.id,
        entityType: "payment",
        entityId: payment._id,
        action: "payment_created",
        message: `Payment of ${payment.amount} recorded via ${payment.paymentMethod}`,
        metadata: { invoiceId: invoice, status: payment.status },
    });

    if (invoiceBecamePaid) {
        await createActivity({
            tenant: req.tenant.id,
            user: req.user.id,
            entityType: "invoice",
            entityId: existingInvoice._id,
            action: "invoice_paid",
            message: "Invoice marked as paid",
        });
    }

    res.status(201).json(payment)
})
