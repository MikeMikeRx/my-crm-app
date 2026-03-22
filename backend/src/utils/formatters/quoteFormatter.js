import { resolveQuoteStatus } from "../status/quoteStatus.js";

export function formatQuote(q) {
    const obj = q.toObject();
    return { ...obj, status: resolveQuoteStatus(obj), totals: q.totals };
}
