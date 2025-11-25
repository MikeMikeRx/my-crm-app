import { asyncHandler } from "../utils/asyncHandler.js";
import Invoice from "../models/Invoice.js";
import Quote from "../models/Quote.js";
import dayjs from "dayjs";

export const getDashboardSummary = asyncHandler(async (req, res) => {
    // --- Invoice Summary --- 
    const invoices = await Invoice.find({ user: req.user.id });

    const totalInvoices = invoices.length;

    const thisMonthInvoices = invoices.filter(inv =>
        dayjs(inv.issueDate).isSame(dayjs(), "month")
    ).length;

    const overdueInvoices = invoices.filter(inv =>
        inv.status !== "paid" &&
        dayjs(inv.dueDate).isBefore(dayjs(), "day")
    ).length;

    const unpaidInvoices = invoices.filter(inv =>
        inv.status === "unpaid"
    ).length;

    const invoiceSummary = {
        total: totalInvoices,
        thisMonth: thisMonthInvoices,
        overdue: overdueInvoices,
        unpaid: unpaidInvoices,
    }

    // reads invoice documents and calculates them dynamically

    // --- Quote Summary ---
    const quotes = await Quote.find({ user: req.user.id });

    const totalQuotes = quotes.length;

    const thisMonthQuotes = quotes.filter(q =>
        dayjs(q.issueDate).isSame(dayjs(), "month")
    ).length;

    const acceptedQuotes = quotes.filter(q => q.status === "accepted").length;

    const declinedQuotes = quotes.filter(q => q.status === "declined").length;

    const expiredQuotes = quotes.filter(q =>
        q.status !== "converted" && dayjs(q.expiryDate).isBefore(dayjs(), "day")
    ).length;

    const quoteSummary = {
        total: totalQuotes,
        thisMonth: thisMonthQuotes,
        accepted: acceptedQuotes,
        declined: declinedQuotes,
        expired: expiredQuotes,
    };

    return res.json({
        invoices: invoiceSummary,
        quotes: quoteSummary,
        payments: {},
        customers: {},
    });    
});