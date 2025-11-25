import { asyncHandler } from "../utils/asyncHandler.js";
import Invoice from "../models/Invoice.js";
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

    return res.json({
        invoices: invoiceSummary,
        quotes: {},
        payments: {},
        customers: {},
    });    
});