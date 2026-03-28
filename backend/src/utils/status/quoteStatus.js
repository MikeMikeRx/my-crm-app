import dayjs from "dayjs";

export const QUOTE_TRANSITIONS = {
    draft: ["sent"],
    sent: ["accepted", "declined", "expired"],
    accepted: [],
    declined: [],
    expired: [],
    converted: [],
};

export function isValidQuoteTransition(from, to) {
    return QUOTE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function resolveQuoteStatus(obj) {
    if (obj.status === "converted" || obj.status === "declined") return obj.status;
    if (obj.expiryDate && dayjs(obj.expiryDate).isBefore(dayjs(), "day")) return "expired";
    return obj.status;
}
