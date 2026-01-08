import { asyncHandler } from "../utils/asyncHandler.js";
import Invoice from "../models/Invoice.js";
import Quote from "../models/Quote.js";
import Payment from "../models/Payment.js";
import Customer from "../models/Customer.js";
import dayjs from "dayjs";

export const getDashboardSummary = asyncHandler(async (req, res) => {
    // ============================================================================
    // LOAD DATA
    // ============================================================================
    const invoices = await Invoice.find({ user: req.user.id });
    const quotes = await Quote.find({ user: req.user.id });
    const payments = await Payment.find({ user: req.user.id });
    const customers = await Customer.find({ user: req.user.id });

    // ============================================================================
    // TOTAL COUNTS (used throughout for percentage calculations)
    // ============================================================================
    const quoteTotal = quotes.length;
    const invoiceTotal = invoices.length;
    const paymentTotal = payments.length;
    const customerTotal = customers.length;

    // ============================================================================
    // HELPER DATA & FUNCTIONS
    // ============================================================================
    // Active customers are those who have at least one invoice or quote
    const activeCustomerIds = new Set([
        ...invoices.map(inv => String(inv.customer)),
        ...quotes.map(q => String(q.customer)),
    ]);

    // Helper function to calculate percentages
    const toPct = (count, total) =>
        total > 0 ? Math.round((count / total) * 100) : 0;

    // ============================================================================
    // INVOICE SUMMARY
    // ============================================================================
    // Recent invoices (last 5)
    const recentInvoices = invoices
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(inv => ({
            _id: inv._id,
            number: inv.invoiceNumber,
            customer: inv.customer,
            total: inv.totals?.total || 0,
            status: inv.status,
            createdAt: inv.createdAt,
        }));

    // This month counts and sums
    const invoiceThisMonth = invoices.filter(inv =>
        dayjs(inv.issueDate).isSame(dayjs(), "month")
    ).length;

    const invoiceMonthSum = invoices
        .filter(inv => dayjs(inv.issueDate).isSame(dayjs(), "month"))
        .reduce((sum, inv) => sum + inv.totals.total, 0);

    const invoiceTotalSum = invoices
        .reduce((sum, inv) => sum + inv.totals.total, 0);

    // Status counts
    const invoicePaid = invoices.filter(inv => inv.status === "paid").length;
    const invoiceUnpaid = invoices.filter(inv => inv.status === "unpaid").length;
    const invoiceOverdue = invoices.filter(inv =>
        inv.status !== "paid" &&
        dayjs(inv.dueDate).isBefore(dayjs(), "day")
    ).length;

    const invoiceSummary = {
        total: invoiceTotal,
        monthCount: invoiceThisMonth,
        monthSum: invoiceMonthSum,
        totalSum: invoiceTotalSum,
        overdue: invoiceOverdue,
        unpaid: invoiceUnpaid,
        preview: [
            { status: "paid", percentage: toPct(invoicePaid, invoiceTotal) },
            { status: "unpaid", percentage: toPct(invoiceUnpaid, invoiceTotal) },
            { status: "overdue", percentage: toPct(invoiceOverdue, invoiceTotal) },
        ],
    };

    // ============================================================================
    // QUOTE SUMMARY
    // ============================================================================
    // Recent quotes (last 5)
    const recentQuotes = quotes
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(q => ({
            _id: q._id,
            number: q.invoiceNumber,
            customer: q.customer,
            total: q.totals?.total || 0,
            status: q.status,
            createdAt: q.createdAt,
        }));

    // This month counts and sums
    const quoteThisMonth = quotes.filter(q =>
        dayjs(q.issueDate).isSame(dayjs(), "month")
    ).length;

    const quoteMonthSum = quotes
        .filter(q => dayjs(q.issueDate).isSame(dayjs(), "month"))
        .reduce((sum, q) => {
            const items = q.items || [];
            const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
            const tax = items.reduce((s, i) => s + (i.quantity * i.unitPrice * (i.taxRate || 0)) / 100, 0);
            return sum + subtotal + tax;
        }, 0);

    const quoteTotalSum = quotes
        .reduce((sum, q) => {
            const items = q.items || [];
            const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
            const tax = items.reduce((s, i) => s + (i.quantity * i.unitPrice * (i.taxRate || 0)) / 100, 0);
            return sum + subtotal + tax;
        }, 0);

    // Status counts
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
        monthCount: quoteThisMonth,
        monthSum: quoteMonthSum,
        totalSum: quoteTotalSum,
        accepted: quoteAccepted,
        declined: quoteDeclined,
        expired: quoteExpired,
        preview: [
            { status: "draft", percentage: toPct(quoteDraft, quoteTotal) },
            { status: "sent", percentage: toPct(quoteSent, quoteTotal) },
            { status: "accepted", percentage: toPct(quoteAccepted, quoteTotal) },
            { status: "declined", percentage: toPct(quoteDeclined, quoteTotal) },
            { status: "expired", percentage: toPct(quoteExpired, quoteTotal) },
        ],
    };

    // ============================================================================
    // DUE BALANCE CALCULATION
    // ============================================================================
    // Map all invoices with their totals
    const invoiceTotals = invoices.map(inv => ({
        id: String(inv._id),
        total: inv.totals?.total || 0
    }));

    // Group payments by invoice
    const paymentsByInvoice = {};
    payments.forEach(p => {
        const inv = String(p.invoice);
        paymentsByInvoice[inv] = (paymentsByInvoice[inv] || 0) + p.amount;
    });

    // Calculate total due balance (invoice total - payments made)
    let dueBalance = 0;
    invoiceTotals.forEach(inv => {
        const paid = paymentsByInvoice[inv.id] || 0;
        const remaining = inv.total - paid;

        if (remaining > 0) {
            dueBalance += remaining;
        }
    });

    // ============================================================================
    // PAYMENT SUMMARY
    // ============================================================================
    // This month counts and sums
    const paymentThisMonth = payments.filter(p =>
        p.paymentDate && dayjs(p.paymentDate).isSame(dayjs(), "month")
    ).length;

    const paymentMonthSum = payments
        .filter(p => dayjs(p.paymentDate).isSame(dayjs(), "month"))
        .reduce((sum, p) => sum + p.amount, 0);

    const paymentTotalSum = payments
        .reduce((sum, p) => sum + p.amount, 0);

    // Status counts
    const paymentCompleted = payments.filter(p => p.status === "completed").length;
    const paymentFailed = payments.filter(p => p.status === "failed").length;
    const paymentPending = payments.filter(p => p.status === "pending").length;

    const paymentSummary = {
        total: paymentTotal,
        monthCount: paymentThisMonth,
        monthSum: paymentMonthSum,
        totalSum: paymentTotalSum,
        completed: paymentCompleted,
        failed: paymentFailed,
        pending: paymentPending,
        dueBalance,
        preview: [
            { status: "completed", percentage: toPct(paymentCompleted, paymentTotal) },
            { status: "pending", percentage: toPct(paymentPending, paymentTotal) },
            { status: "failed", percentage: toPct(paymentFailed, paymentTotal) },
        ],
    };

    // ============================================================================
    // CUSTOMER SUMMARY
    // ============================================================================
    const customerNewThisMonth = customers.filter(c =>
        dayjs(c.createdAt).isSame(dayjs(), "month")
    ).length;

    const activeCustomers = customers.filter(c =>
        activeCustomerIds.has(String(c._id))
    ).length;

    const inactiveCustomers = customerTotal - activeCustomers;

    const customerSummary = {
        total: customerTotal,
        newCount: customerNewThisMonth,
        active: activeCustomers,
        preview: [
            { status: "active", percentage: toPct(activeCustomers, customerTotal) },
            { status: "inactive", percentage: toPct(inactiveCustomers, customerTotal) },
        ],
    };

    // ============================================================================
    // CUSTOMER DETAILS (for customer list table)
    // ============================================================================
    // Calculate per-customer metrics: quotes, invoices, payments, outstanding balance
    const customerDetails = customers.map(customer => {
        const customerId = String(customer._id);
        const isActive = activeCustomerIds.has(customerId);

        // Count quotes for this customer
        const customerQuotes = quotes.filter(q => String(q.customer) === customerId).length;

        // Count invoices for this customer
        const customerInvoices = invoices.filter(inv => String(inv.customer) === customerId).length;

        // Count payments for this customer (via their invoices)
        const customerInvoiceIds = invoices
            .filter(inv => String(inv.customer) === customerId)
            .map(inv => String(inv._id));

        const customerPayments = payments.filter(p =>
            customerInvoiceIds.includes(String(p.invoice))
        ).length;

        // Calculate outstanding balance for this customer
        const customerInvoiceTotals = invoices
            .filter(inv => String(inv.customer) === customerId)
            .map(inv => ({
                id: String(inv._id),
                total: inv.totals?.total || 0
            }));

        let customerOutstanding = 0;
        customerInvoiceTotals.forEach(inv => {
            const paid = paymentsByInvoice[inv.id] || 0;
            const remaining = inv.total - paid;
            if (remaining > 0) {
                customerOutstanding += remaining;
            }
        });

        return {
            _id: customer._id,
            name: customer.name,
            email: customer.email,
            company: customer.company,
            isActive,
            quotes: customerQuotes,
            invoices: customerInvoices,
            payments: customerPayments,
            outstanding: customerOutstanding,
        };
    });

    // ============================================================================
    // RESPONSE
    // ============================================================================
    return res.json({
        invoices: invoiceSummary,
        quotes: quoteSummary,
        payments: paymentSummary,
        customers: customerSummary,
        customerDetails,
        // Total counts used for calculating customer percentage share
        customerMaxValues: {
            quotes: quoteTotal,
            invoices: invoiceTotal,
            payments: paymentTotal,
        },
        recentInvoices,
        recentQuotes,
    });
});
