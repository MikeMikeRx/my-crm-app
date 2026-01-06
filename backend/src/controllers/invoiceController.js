import Invoice from "../models/Invoice.js";
import Customer from "../models/Customer.js";
import Quote from "../models/Quote.js";
import dayjs from "dayjs";
import { asyncHandler } from "../utils/asyncHandler.js";

// ============================================================================
// GET ALL INVOICES
// ============================================================================
export const getInvoices = asyncHandler(async (req, res, next) => {
    // ========================================================================
    // FETCH INVOICES
    // ========================================================================
    // Find all invoices belonging to the authenticated user
    // Populate customer details (name, email, company)
    // Sort by creation date (newest first)
    const invoices = await Invoice.find({ user: req.user.id })
        .populate("customer", "name email company")
        .sort({ createdAt: -1 });

    // ========================================================================
    // AUTO-UPDATE OVERDUE STATUS
    // ========================================================================
    // After due date, invoice status automatically changes to "overdue"
    const withOverdue = invoices.map(inv => {
        const obj = inv.toObject();

        // Check if invoice is unpaid and past due date
        if (obj.status !== "paid" && dayjs(obj.dueDate).isBefore(dayjs(), "day")) {
            obj.status = "overdue"
        };

        return {
            ...obj,
            totals: inv.totals
        };
    });

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.json(withOverdue)
});

// ============================================================================
// GET INVOICE BY ID
// ============================================================================
export const getInvoiceById = asyncHandler(async (req, res, next) => {
    // ========================================================================
    // FETCH INVOICE
    // ========================================================================
    // Find invoice by ID, ensuring it belongs to the authenticated user
    // Populate customer details (name, email, company)
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user.id })
        .populate("customer", "name email company");

    // Check if invoice exists
    if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
    }

    // ========================================================================
    // AUTO-UPDATE OVERDUE STATUS
    // ========================================================================
    const obj = invoice.toObject();

    // Check if invoice is unpaid and past due date
    if (obj.status !== "paid" && dayjs(obj.dueDate).isBefore(dayjs(), "day")) {
        obj.status = "overdue";
    };

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.json({
        ...obj,
        totals: invoice.totals
    });
});

// ============================================================================
// CREATE INVOICE
// ============================================================================
export const createInvoice = asyncHandler(async (req, res, next) => {
    // ========================================================================
    // EXTRACT INPUT
    // ========================================================================
    const { customer, quote, invoiceNumber, issueDate, dueDate, items, notes } = req.body;

    // ========================================================================
    // VALIDATE CUSTOMER
    // ========================================================================
    // Ensure customer exists and belongs to the authenticated user
    const existingCustomer = await Customer.findOne({ _id: customer, user: req.user.id });
    if (!existingCustomer) {
        return res.status(400).json({ message: "Invalid customer ID" });
    }

    // ========================================================================
    // VALIDATE QUOTE (if provided)
    // ========================================================================
    let quoteDoc = null;

    if (quote) {
        // Find quote and verify ownership
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

        // Block invoice creation from expired quotes
        if (quoteDoc.status === "expired") {
            return res.status(400).json({
                message: "Cannot create invoice from a expired quote"
            });
        }

        // Block invoice creation from already converted quotes
        if (quoteDoc.status === "converted") {
            return res.status(400).json({
                message: "This quote has already been converted to an invoice"
            });
        }
    };

    // ========================================================================
    // CREATE INVOICE
    // ========================================================================
    // Create new invoice with status defaulting to "unpaid"
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

    // ========================================================================
    // UPDATE QUOTE STATUS
    // ========================================================================
    // Mark quote as "converted" after successful invoice creation
    if (quote) {
        await Quote.findOneAndUpdate(
            { _id: quote, user: req.user.id },
            { status: "converted" }
        );
    }

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.status(201).json({
        ...newInvoice.toObject(),
        totals: newInvoice.totals
    });
});

// ============================================================================
// UPDATE INVOICE
// ============================================================================
export const updateInvoice = asyncHandler(async (req, res) => {
    // ========================================================================
    // EXTRACT & VALIDATE INPUT
    // ========================================================================
    const incoming = req.body;

    // Enforce status rules: only "paid" or "unpaid" allowed
    // System automatically sets "overdue" status based on due date
    let status = incoming.status;
    if (status !== "paid") status = "unpaid";

    // ========================================================================
    // UPDATE INVOICE
    // ========================================================================
    // Find and update invoice, ensuring it belongs to the authenticated user
    // Options:
    // - new: true -> return updated document
    // - runValidators: true -> run model validations on update
    const updated = await Invoice.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        { ...incoming, status },
        { new: true, runValidators: true }
    );

    // Check if invoice exists
    if (!updated) {
        return res.status(404).json({ message: "Invoice not found" })
    }

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.json({
        ...updated.toObject(),
        totals: updated.totals
    });
});

// ============================================================================
// DELETE INVOICE
// ============================================================================
// NOTE: This endpoint exists but is not currently used in the application
export const deleteInvoice = asyncHandler(async (req, res, next) => {
    // ========================================================================
    // DELETE INVOICE
    // ========================================================================
    // Find and delete invoice, ensuring it belongs to the authenticated user
    const invoice = await Invoice.findOneAndDelete({
        _id: req.params.id,
        user: req.user.id
    })

    // Check if invoice exists
    if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" })
    }

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.json({ message: "Invoice deleted successfully" })
})
