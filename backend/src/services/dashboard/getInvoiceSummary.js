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

    const invoicePaid = invoices.filter(inv => resolveInvoiceStatus(inv) === "paid").length;
    const invoicePartiallyPaid = invoices.filter(inv => resolveInvoiceStatus(inv) === "partially_paid").length;
    const invoiceOverdue = invoices.filter(inv => resolveInvoiceStatus(inv) === "overdue").length;
    const invoiceUnpaid = invoices.filter(inv => resolveInvoiceStatus(inv) === "unpaid").length;

    const invoiceSummary = {
        total: invoiceTotal,
        monthCount: invoiceThisMonth,
        monthSum: invoiceMonthSum,
        totalSum: invoiceTotalSum,
        overdue: invoiceOverdue,
        unpaid: invoiceUnpaid,
        partiallyPaid: invoicePartiallyPaid,
        preview: [
            { status: "paid", percentage: toPct(invoicePaid, invoiceTotal) },
            { status: "partially_paid", percentage: toPct(invoicePartiallyPaid, invoiceTotal) },
            { status: "unpaid", percentage: toPct(invoiceUnpaid, invoiceTotal) },
            { status: "overdue", percentage: toPct(invoiceOverdue, invoiceTotal) },
        ],
    };

    return { invoiceSummary, recentInvoices };
};
