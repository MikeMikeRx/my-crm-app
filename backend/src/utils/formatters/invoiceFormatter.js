import { resolveInvoiceStatus } from "../status/invoiceStatus.js";

export function formatInvoice(inv) {
    const obj = inv.toObject();
    return { ...obj, status: resolveInvoiceStatus(obj), totals: inv.totals };
}
