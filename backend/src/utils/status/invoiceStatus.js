import dayjs from "dayjs";

export function resolveInvoiceStatus(inv) {
    if (inv.status === "paid") return "paid";
    if (dayjs(inv.dueDate).isBefore(dayjs(), "day")) return "overdue";
    return inv.status;
}
