import Invoice from "../models/Invoice.js";
import Customer from "../models/Customer.js";
import dayjs from "dayjs";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get All Invoices
export const getInvoices = asyncHandler(async (req, res, next) => {
    const invoices = await Invoice.find({ user: req.user.id })
        .populate("customer", "name email company")
        .sort({ createdAt: -1 });

    // After Due Date Invoice status turns automaticly to "overdue"    
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

// Get Single Invoice By ID
export const getInvoiceById = asyncHandler(async (req, res, next) => {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user.id })
        .populate("customer", "name email company");

    if (!invoice) return res.status(404).json({ message: "Invoice not found"});

    const obj = invoice.toObject();

    // Status changes after due date
    if (obj.status !== "paid" && dayjs(obj.dueDate).isBefore(dayjs(), "day")) {
        obj.status = "overdue";
    };
    
    res.json({
        ...invoice.toObject(),
        totals: invoice.totals
    });
});

// Create Invoice
export const createInvoice = asyncHandler(async (req, res, next) => {
    const { customer, invoiceNumber, issueDate, dueDate, items, notes } = req.body;

    const existingCustomer = await Customer.findOne({ _id: customer, user: req.user.id });
    if (!existingCustomer) return res.status(400).json({ message: "Invalid customer ID" });
    
    const newInvoice = await Invoice.create({
        user: req.user.id,
        customer,
        invoiceNumber,
        issueDate,
        dueDate,
        items,
        status: "unpaid",
        notes,
    });

    res.status(201).json({
        ...newInvoice.toObject(),
        totals: newInvoice.totals
    });
});

// Update Invoice
export const updateInvoice = asyncHandler(async (req, res) => {
    const incoming = req.body;

    // Enforce status rules
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

// Delete Invoice - X not used 
export const deleteInvoice = asyncHandler(async (req, res, next) => {
        const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, user: req.user.id })
        if (!invoice) return res.status(404).json({ message: "Invoice not found" })
        res.json({ message: "Invoice deleted successfully" })
})