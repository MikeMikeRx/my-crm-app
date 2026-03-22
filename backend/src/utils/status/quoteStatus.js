import dayjs from "dayjs";

export function resolveQuoteStatus(obj) {
    if (obj.status === "converted" || obj.status === "declined") return obj.status;
    if (obj.expiryDate && dayjs(obj.expiryDate).isBefore(dayjs(), "day")) return "expired";
    return obj.status;
}
