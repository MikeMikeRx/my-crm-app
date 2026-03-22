import Invoice from "../models/Invoice.js";
import Customer from "../models/Customer.js";
import Quote from "../models/Quote.js";
import Payment from "../models/Payment.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveInvoiceStatus, computePaymentStatus } from "../utils/invoiceStatus.js";

export const getInvoices = asyncHandler(async (req, res) => {
    const invoices = await Invoice.find({ user: req.user.id })
        .populate("customer", "name email company")
        .sort({ createdAt: -1 });

    const result = invoices.map(inv => {
        const obj = inv.toObject();
        return { ...obj, status: resolveInvoiceStatus(obj), totals: inv.totals };
    });

    res.json(result);
});

export const getInvoiceById = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user.id })
        .populate("customer", "name email company");

    if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
    }

    const obj = invoice.toObject();

    res.json({ ...obj, status: resolveInvoiceStatus(obj), totals: invoice.totals });
});

export const createInvoice = asyncHandler(async (req, res) => {
    const { customer, quote, invoiceNumber, issueDate, dueDate, items, notes } = req.body;

    const existingCustomer = await Customer.findOne({ _id: customer, user: req.user.id });
    if (!existingCustomer) {
        return res.status(400).json({ message: "Invalid customer ID" });
    }

    let quoteDoc = null;

    if (quote) {
        quoteDoc = await Quote.findOne({ _id: quote, user: req.user.id });

        if (!quoteDoc) {
            return res.status(400).json({ message: "Invalid quote ID" });
        }

        if (quoteDoc.status === "draft") {
            return res.status(400).json({
                message: "Cannot create invoice from a draft quote"
            });
        }

        if (quoteDoc.status === "declined") {
            return res.status(400).json({
                message: "Cannot create invoice from a declined quote"
            });
        }

        if (quoteDoc.status === "expired") {
            return res.status(400).json({
                message: "Cannot create invoice from a expired quote"
            });
        }

        if (quoteDoc.status === "converted") {
            return res.status(400).json({
                message: "This quote has already been converted to an invoice"
            });
        }
    };

    const newInvoice = await Invoice.create({
        user: req.user.id,
        customer,
        invoiceNumber,
        issueDate,
        dueDate,
        items,
        status: "unpaid",
        notes,
        quote: quote || undefined,
    });

    if (quote) {
        await Quote.findOneAndUpdate(
            { _id: quote, user: req.user.id },
            { status: "converted" }
        );
    }

    res.status(201).json({
        ...newInvoice.toObject(),
        totals: newInvoice.totals
    });
});

export const updateInvoice = asyncHandler(async (req, res) => {
    const { status: _ignored, ...fields } = req.body;

    const updated = await Invoice.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        fields,
        { new: true, runValidators: true }
    );

    if (!updated) {
        return res.status(404).json({ message: "Invoice not found" });
    }

    const payments = await Payment.find({ invoice: updated._id, status: "completed" });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    updated.status = computePaymentStatus(totalPaid, updated.totals.total);
    await updated.save();

    const obj = updated.toObject();
    res.json({ ...obj, status: resolveInvoiceStatus(obj), totals: updated.totals });
});

export const deleteInvoice = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findOneAndDelete({
        _id: req.params.id,
        user: req.user.id
    })

    if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" })
    }

    res.json({ message: "Invoice deleted successfully" })
})
