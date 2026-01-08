import Invoice from "../models/Invoice.js";
import Customer from "../models/Customer.js";
import Quote from "../models/Quote.js";
import dayjs from "dayjs";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET ALL INVOICES
export const getInvoices = asyncHandler(async (req, res, next) => {
    const invoices = await Invoice.find({ user: req.user.id })
        .populate("customer", "name email company")
        .sort({ createdAt: -1 });

    // After due date, invoice status automatically changes to "overdue"
    const withOverdue = invoices.map(inv => {
        const obj = inv.toObject();

        if (obj.status !== "paid" && dayjs(obj.dueDate).isBefore(dayjs(), "day")) {
            obj.status = "overdue"
        };

        return {
            ...obj,
            totals: inv.totals
        };
    });

    res.json(withOverdue)
});

// GET INVOICE BY ID
export const getInvoiceById = asyncHandler(async (req, res, next) => {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user.id })
        .populate("customer", "name email company");

    if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
    }

    const obj = invoice.toObject();

    if (obj.status !== "paid" && dayjs(obj.dueDate).isBefore(dayjs(), "day")) {
        obj.status = "overdue";
    };

    res.json({
        ...obj,
        totals: invoice.totals
    });
});

// CREATE INVOICE
export const createInvoice = asyncHandler(async (req, res, next) => {
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

        // Block invoice creation from declined quotes
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

    // Mark quote as "converted" after successful invoice creation
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

// UPDATE INVOICE
export const updateInvoice = asyncHandler(async (req, res) => {
    const incoming = req.body;

    // Enforce status rules: only "paid" or "unpaid" allowed
    // System automatically sets "overdue" status based on due date
    let status = incoming.status;
    if (status !== "paid") status = "unpaid";

    const updated = await Invoice.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        { ...incoming, status },
        { new: true, runValidators: true }
    );

    if (!updated) {
        return res.status(404).json({ message: "Invoice not found" })
    }

    res.json({
        ...updated.toObject(),
        totals: updated.totals
    });
});

// DELETE INVOICE
// NOTE: This endpoint exists but is not currently used in the application
export const deleteInvoice = asyncHandler(async (req, res, next) => {
    const invoice = await Invoice.findOneAndDelete({
        _id: req.params.id,
        user: req.user.id
    })

    if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" })
    }

    res.json({ message: "Invoice deleted successfully" })
})
