import dayjs from "dayjs";

export const INVOICE_TRANSITIONS = {
    draft: ["sent"],
    sent: ["partially_paid", "paid"],
    partially_paid: ["paid"],
    paid: [],
};

export function isValidTransition(from, to) {
    return INVOICE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function resolveInvoiceStatus(inv) {
    if (inv.status === "paid") return "paid";
    if ((inv.status === "sent" || inv.status === "partially_paid") && dayjs(inv.dueDate).isBefore(dayjs(), "day")) return "overdue";
    return inv.status;
}
