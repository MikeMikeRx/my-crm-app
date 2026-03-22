export function computePaymentStatus(totalPaid, invoiceTotal) {
    if (invoiceTotal > 0 && totalPaid >= invoiceTotal) return "paid";
    if (totalPaid > 0) return "partially_paid";
    return "unpaid";
}
