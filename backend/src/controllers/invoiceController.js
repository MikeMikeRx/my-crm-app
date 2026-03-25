import Invoice from "../models/Invoice.js";
import Customer from "../models/Customer.js";
import Quote from "../models/Quote.js";
import Payment from "../models/Payment.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidTransition } from "../utils/status/invoiceStatus.js";
import { formatInvoice } from "../utils/formatters/invoiceFormatter.js";
import { CUSTOMER_POPULATE, DEFAULT_SORT } from "../utils/queries/queryDefaults.js";

export const getInvoices = asyncHandler(async (req, res) => {
    const invoices = await Invoice.find({ tenant: req.tenant.id })
        .populate(...CUSTOMER_POPULATE)
        .sort(DEFAULT_SORT);

    const result = invoices.map(inv => formatInvoice(inv));

    res.json(result);
});

export const getInvoiceById = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findOne({ _id: req.params.id, tenant: req.tenant.id })
        .populate(...CUSTOMER_POPULATE);

    if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
    }

    res.json(formatInvoice(invoice));
});

export const createInvoice = asyncHandler(async (req, res) => {
    const { customer, quote, invoiceNumber, issueDate, dueDate, items, notes } = req.body;

    const existingCustomer = await Customer.findOne({ _id: customer, tenant: req.tenant.id });
    if (!existingCustomer) {
        return res.status(400).json({ message: "Invalid customer ID" });
    }

    let quoteDoc = null;

    if (quote) {
        quoteDoc = await Quote.findOne({ _id: quote, tenant: req.tenant.id });

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
        tenant: req.tenant.id,
        customer,
        invoiceNumber,
        issueDate,
        dueDate,
        items,
        notes,
        quote: quote || undefined,
    });

    if (quote) {
        await Quote.findOneAndUpdate(
            { _id: quote, tenant: req.tenant.id },
            { status: "converted" }
        );
    }

    res.status(201).json(formatInvoice(newInvoice));
});

export const updateInvoice = asyncHandler(async (req, res) => {
    const { issueDate, dueDate, items, notes } = req.body;

    const invoice = await Invoice.findOne({ _id: req.params.id, tenant: req.tenant.id });
    if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoice.status !== "draft") {
        return res.status(400).json({ message: `Cannot edit an invoice with status "${invoice.status}". Only draft invoices can be modified.` });
    }

    const updated = await Invoice.findOneAndUpdate(
        { _id: req.params.id, tenant: req.tenant.id },
        { issueDate, dueDate, items, notes },
        { new: true, runValidators: true }
    );

    res.json(formatInvoice(updated));
});

export const transitionInvoiceStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    const invoice = await Invoice.findOne({ _id: req.params.id, tenant: req.tenant.id });
    if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
    }

    if (!isValidTransition(invoice.status, status)) {
        return res.status(400).json({
            message: `Invalid transition: "${invoice.status}" → "${status}"`,
        });
    }

    invoice.status = status;
    await invoice.save();

    res.json(formatInvoice(invoice));
});

export const deleteInvoice = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findOne({ _id: req.params.id, tenant: req.tenant.id });
    if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
    }

    const hasPayments = await Payment.exists({ invoice: invoice._id });
    if (hasPayments) {
        return res.status(400).json({ message: "Cannot delete an invoice that has associated payments" });
    }

    await invoice.deleteOne();

    res.json({ message: "Invoice deleted successfully" });
})
