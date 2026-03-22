import dayjs from "dayjs";
import { toPct } from "../../utils/dashboard/percentages.js";
import { calcQuoteTotal } from "../../utils/dashboard/money.js";

export const getQuoteSummary = (quotes) => {
    const quoteTotal = quotes.length;

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

    const quoteThisMonth = quotes.filter(q =>
        dayjs(q.issueDate).isSame(dayjs(), "month")
    ).length;

    const quoteMonthSum = quotes
        .filter(q => dayjs(q.issueDate).isSame(dayjs(), "month"))
        .reduce((sum, q) => sum + calcQuoteTotal(q), 0);

    const quoteTotalSum = quotes
        .reduce((sum, q) => sum + calcQuoteTotal(q), 0);

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

    return { quoteSummary, recentQuotes };
};
