import Payment from "../models/Payment.js"
import Invoice from "../models/Invoice.js"

export const getPayments = async (req, res, next) => {
    try {
        const payments = await Payment.find({ user: req.user.id })
            .populate({
                path: "invoice",
                select: "invoiceNumber status customer",
                populate: { path: "customer", select: "name company" },
            })
            .sort({ paymentDate: -1 })
        res.json(payments)
    } catch (err) {
        next(err)
    }
}

export const getPaymentById = async (req, res, next) => {
    try {
        const payment = await Payment.findOne({_id: req.params.id, user: req.user.id })
            .populate({
                path: "invoice",
                select: "invoiceNumber status customer",
                populate: { path: "customer", select: "name company"}
            })
        if (!payment) return res.status(404).json({ message: "Payment not found" })
        res.json(payment)
    } catch (err) {
        next(err)
    }
}

export const createPayment = async (req, res, next) => {
    try {
        const { invoice, amount, paymentDate, paymentMethod, notes } = req.body

        if (!invoice || amount == null || !paymentMethod) {
            return res.status(400).json({ message: "Invoice, amount, and paymentMethod are required" })
        }
        if (Number(amount) <= 0) {
            return res.status(400).json({ message: "Amount must be greater than 0" })
        }

        const existingInvoice = await Invoice.findOne({ _id: invoice, user: req.user.id })
        if (!existingInvoice) return res.status(400).json({ message: "Invalid invoice ID" })

        const payment = await Payment.create({
            user: req.user.id,
            invoice,
            amount,
            paymentMethod,
            paymentDate,
            notes,
        })

        const payments = await Payment.find({ invoice })
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
        const invoiceTotal = existingInvoice.items.reduce(
            (sum, i) => sum + i.quantity * i.unitPrice,
            0
        )

        if (totalPaid >= invoiceTotal) {
            existingInvoice.status = "paid"
            await existingInvoice.save()
        }

        res.status(201).json(payment)
    } catch (err) {
        next(err)
    }
}

export const deletePayment = async (req, res, next) => {
    try {
        const payment = await Payment.findOneAndDelete({ _id: req.params.id, user: req.user.id })
        if (!payment) return res.status(404).json({ message: "Payment not found" })
        res.json({ message: "Payment deleted successfully" })
    } catch(err) {
        next(err)
    }
}