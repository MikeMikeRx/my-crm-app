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

    const toPct = (count, total) =>
        total > 0 ? Math.round((count / total) * 100) : 0;

    // --- Invoice Summary ---
    const invoiceTotal = invoices.length;

    const recentInvoices = invoices
        .sort ((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(inv => ({
            _id: inv._id,
            number: inv.invoiceNumber,
            customer: inv.customer,
            total: inv.totals?.total || 0,
            status: inv.status,
            createdAt: inv.createdAt,
        }));

    const invoiceThisMonth = invoices.filter(inv =>
            dayjs(inv.issueDate).isSame(dayjs(), "month")
        ).length;

    const invoicePaid = invoices.filter(inv => inv.status === "paid").length;
    const invoiceUnpaid =  invoices.filter(inv => inv.status === "unpaid").length;

    const invoiceOverdue = invoices.filter(inv =>
            inv.status !== "paid" &&
            dayjs(inv.dueDate).isBefore(dayjs(), "day")
        ).length;

    const invoiceSummary = {
        total: invoiceTotal,
        thisMonth: invoiceThisMonth,  
        overdue: invoiceOverdue,
        unpaid: invoiceUnpaid,
        preview: [
            { status: "paid", percentage: toPct(invoicePaid ,invoiceTotal) },
            { status: "unpaid", percentage: toPct(invoiceUnpaid ,invoiceTotal) },
            { status: "overdue", percentage: toPct(invoiceOverdue ,invoiceTotal) },
        ],
    };

    // --- Quote Summary ---
    const quoteTotal = quotes.length;

        const recentQuotes = quotes
        .sort ((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(q => ({
            _id: q._id,
            number: q.invoiceNumber,
            customer: q.customer,
            total: q.totals?.total || 0,
            status: q.status,
            createdAt: q.createdAt,
        }));

    const quoteThisMonth = quotes.filter(q =>
            dayjs(q.issueDate).isSame(dayjs(), "month")
        ).length;

    const quoteDraft = quotes.filter(q => q.status === "draft").length;
    const quoteSent = quotes.filter(q => q.status === "sent").length;
    const quoteAccepted = quotes.filter(q => q.status === "accepted").length;
    const quoteDeclined = quotes.filter(q => q.status === "declined").length;

    const quoteExpired = quotes.filter(q =>
            q.status !== "converted" &&
            dayjs(q.expiryDate).isBefore(dayjs(), "day")
        ).length;

    const quoteSummary = {
        total: quoteTotal,
        thisMonth: quoteThisMonth,
        accepted: quoteAccepted,
        declined: quoteDeclined,
        expired: quoteExpired,
        preview: [
            {status: "draft", percentage: toPct(quoteDraft, quoteTotal) },
            {status: "sent", percentage: toPct(quoteSent, quoteTotal) },
            {status: "accepted", percentage: toPct(quoteAccepted, quoteTotal) },
            {status: "declined", percentage: toPct(quoteDeclined, quoteTotal) },
            {status: "expired", percentage: toPct(quoteExpired, quoteTotal) },
        ],
    };

    // --- Payment Summary ---
    const paymentTotal = payments.length;

    const paymentThisMonth = payments.filter(p =>
            p.paymentDate && dayjs(p.paymentDate).isSame(dayjs(), "month")
        ).length;

    const paymentCompleted = payments.filter(p => p.status === "completed").length;
    const paymentFailed = payments.filter(p => p.status === "failed").length;
    const paymentPending = payments.filter(p => p.status === "pending").length;


    const paymentSummary = {
        total: paymentTotal,
        thisMonth: paymentThisMonth,
        completed: paymentCompleted,
        failed: paymentFailed,
        pending: paymentPending,
        preview: [
            { status: "completed", percentage: toPct(paymentCompleted, paymentTotal) },
            { status: "pending", percentage: toPct(paymentPending, paymentTotal) },
            { status: "failed", percentage: toPct(paymentFailed, paymentTotal) },
        ],
    };

    // --- Customer Summary ---
    const customerTotal = customers.length;

    const customerNewThisMonth = customers.filter(c =>
            dayjs(c.createdAt).isSame(dayjs(), "month")
        ).length;

    const activeCustomers = customers.filter(c =>
            activeCustomerIds.has(String(c._id))
        ).length;

    const inactiveCustomers = customerTotal - activeCustomers

    const customerSummary = {
        total: customerTotal,
        new: customerNewThisMonth,
        active: activeCustomers,
        preview: [
            { status: "active", percentage: toPct(activeCustomers, customerTotal) },
            { status: "inactive", percentage: toPct(inactiveCustomers, customerTotal) },
        ],
    };

    return res.json({
        invoices: invoiceSummary,
        quotes: quoteSummary,
        payments: paymentSummary,
        customers: customerSummary,
        recentInvoices,
        recentQuotes,
    });    
});