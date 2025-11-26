import { asyncHandler } from "../utils/asyncHandler.js";
import Invoice from "../models/Invoice.js";
import Quote from "../models/Quote.js";
import Payment from "../models/Payment.js";
import Customer from "../models/Customer.js";
import dayjs from "dayjs";

export const getDashboardSummary = asyncHandler(async (req, res) => {
    // --- Load Data ---
    const invoices = await Invoice.find({ user: req.user.id });
    const quotes = await Quote.find({ user: req.user.id });
    const payments = await Payment.find({ user: req.user.id });
    const customers = await Customer.find({ user: req.user.id });

    const activeCustomerIds = new Set([
        ...invoices.map(inv => String(inv.customer)),
        ...quotes.map(q => String(q.customer)),
    ]);

    // --- Invoice Summary ---
    const invoiceSummary = {
        total: invoices.length,

        thisMonth: invoices.filter(inv =>
            dayjs(inv.issueDate).isSame(dayjs(), "month")
        ).length,
        
        overdue: invoices.filter(inv =>
            inv.status !== "paid" &&
            dayjs(inv.dueDate).isBefore(dayjs(), "day")
        ).length,

        unpaid: invoices.filter(inv => inv.status === "unpaid").length,
    };

    // --- Quote Summary ---
    const quoteSummary = {
        total: quotes.length,

        thisMonth: quotes.filter(q =>
            dayjs(q.issueDate).isSame(dayjs(), "month")
        ).length,

        accepted: quotes.filter(q => q.status === "accepted").length,

        declined: quotes.filter(q => q.status === "declined").length,

        expired: quotes.filter(q =>
            q.status !== "converted" &&
            dayjs(q.expiryDate).isBefore(dayjs(), "day")
        ).length,
    };

    // --- Payment Summary ---
    const paymentSummary = {
        total: payments.length,

        thisMonth: payments.filter(p =>
            p.paymentDate && dayjs(p.paymentDate).isSame(dayjs(), "month")
        ).length,

        completed: payments.filter(p => p.status === "completed").length,

        failed: payments.filter(p => p.status === "failed").length,

        pending: payments.filter(p => p.status === "pending").length,
    };

    // --- Customer Summary ---
    const customerSummary = {
        total: customers.length,

        new: customers.filter(c =>
            dayjs(c.createdAt).isSame(dayjs(), "month")
        ).length,
        
        active: customers.filter(c =>
            activeCustomerIds.has(String(c._id))
        ).length,
    };

    return res.json({
        invoices: invoiceSummary,
        quotes: quoteSummary,
        payments: paymentSummary,
        customers: customerSummary,
    });    
});