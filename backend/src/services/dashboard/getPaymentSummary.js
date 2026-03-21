import dayjs from "dayjs";
import { toPct } from "../../utils/dashboard/percentages.js";

export const getPaymentSummary = (payments, invoices) => {
    const paymentTotal = payments.length;
    const paymentsByInvoice = {};
    payments.forEach(p => {
        const inv = String(p.invoice);
        paymentsByInvoice[inv] = (paymentsByInvoice[inv] || 0) + p.amount;
    });

    let dueBalance = 0;
    invoices.forEach(inv => {
        const paid = paymentsByInvoice[String(inv._id)] || 0;
        const remaining = (inv.totals?.total || 0) - paid;
        if (remaining > 0) dueBalance += remaining;
    });

    const paymentThisMonth = payments.filter(p =>
        p.paymentDate && dayjs(p.paymentDate).isSame(dayjs(), "month")
    ).length;

    const paymentMonthSum = payments
        .filter(p => dayjs(p.paymentDate).isSame(dayjs(), "month"))
        .reduce((sum, p) => sum + p.amount, 0);

    const paymentTotalSum = payments
        .reduce((sum, p) => sum + p.amount, 0);

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

    return { paymentSummary, paymentsByInvoice };
};
