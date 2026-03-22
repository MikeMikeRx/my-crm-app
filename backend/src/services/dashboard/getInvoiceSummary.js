import dayjs from "dayjs";
import { resolveInvoiceStatus } from "../../utils/status/invoiceStatus.js";
import { toPct } from "../../utils/dashboard/percentages.js";

export const getInvoiceSummary = (invoices) => {
    const invoiceTotal = invoices.length;

    const recentInvoices = invoices
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(inv => ({
            _id: inv._id,
            number: inv.invoiceNumber,
            customer: inv.customer,
            total: inv.totals?.total || 0,
            status: resolveInvoiceStatus(inv),
            createdAt: inv.createdAt,
        }));

    const invoiceThisMonth = invoices.filter(inv =>
        dayjs(inv.issueDate).isSame(dayjs(), "month")
    ).length;

    const invoiceMonthSum = invoices
        .filter(inv => dayjs(inv.issueDate).isSame(dayjs(), "month"))
        .reduce((sum, inv) => sum + inv.totals.total, 0);

    const invoiceTotalSum = invoices
        .reduce((sum, inv) => sum + inv.totals.total, 0);

    const invoiceDraft = invoices.filter(inv => resolveInvoiceStatus(inv) === "draft").length;
    const invoiceSent = invoices.filter(inv => resolveInvoiceStatus(inv) === "sent").length;
    const invoicePartiallyPaid = invoices.filter(inv => resolveInvoiceStatus(inv) === "partially_paid").length;
    const invoiceOverdue = invoices.filter(inv => resolveInvoiceStatus(inv) === "overdue").length;
    const invoicePaid = invoices.filter(inv => resolveInvoiceStatus(inv) === "paid").length;

    const invoiceSummary = {
        total: invoiceTotal,
        monthCount: invoiceThisMonth,
        monthSum: invoiceMonthSum,
        totalSum: invoiceTotalSum,
        draft: invoiceDraft,
        sent: invoiceSent,
        partiallyPaid: invoicePartiallyPaid,
        overdue: invoiceOverdue,
        preview: [
            { status: "draft", percentage: toPct(invoiceDraft, invoiceTotal) },
            { status: "sent", percentage: toPct(invoiceSent, invoiceTotal) },
            { status: "partially_paid", percentage: toPct(invoicePartiallyPaid, invoiceTotal) },
            { status: "paid", percentage: toPct(invoicePaid, invoiceTotal) },            
            { status: "overdue", percentage: toPct(invoiceOverdue, invoiceTotal) },
        ],
    };

    return { invoiceSummary, recentInvoices };
};
