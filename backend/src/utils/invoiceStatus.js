import dayjs from "dayjs";

export function resolveQuoteStatus(obj) {
    if (obj.status === "converted" || obj.status === "declined") return obj.status;
    if (obj.expiryDate && dayjs(obj.expiryDate).isBefore(dayjs(), "day")) return "expired";
    return obj.status;
}


export function resolveInvoiceStatus(inv) {
    if (inv.status === "paid") return "paid";
    if (dayjs(inv.dueDate).isBefore(dayjs(), "day")) return "overdue";
    return inv.status;
}

export function computePaymentStatus(totalPaid, invoiceTotal) {
    if (invoiceTotal > 0 && totalPaid >= invoiceTotal) return "paid";
    if (totalPaid > 0) return "partially_paid";
    return "unpaid";
}
