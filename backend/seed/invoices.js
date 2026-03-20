const fmt = (d) => d.toISOString().slice(0, 10).replace(/-/g, "")

export function getInvoices(userId, { acme, nova }, { acmeAccepted, acmePaid, acmeOverdue, novaAccepted }) {
    const nowTs = Date.now()
    const now = new Date(nowTs)
    const today = fmt(now)

    return {
        novaUnpaid: {
            user: userId,
            customer: nova._id,
            invoiceNumber: `INV-${fmt(new Date(nowTs - 5 * 86400000))}-1001`,
            issueDate: new Date(nowTs - 5 * 86400000),
            dueDate: new Date(nowTs + 9 * 86400000),
            status: "unpaid",
            items: novaAccepted.items,
            quote: novaAccepted._id,
        },
        acmeUnpaid: {
            user: userId,
            customer: acme._id,
            invoiceNumber: `INV-${today}-1001`,
            issueDate: now,
            dueDate: new Date(nowTs + 14 * 86400000),
            status: "unpaid",
            items: acmeAccepted.items,
            quote: acmeAccepted._id,
        },
        acmePaid: {
            user: userId,
            customer: acme._id,
            invoiceNumber: `INV-${fmt(new Date(nowTs - 10 * 86400000))}-1001`,
            issueDate: new Date(nowTs - 10 * 86400000),
            dueDate: new Date(nowTs - 2 * 86400000),
            status: "paid",
            items: acmePaid.items,
            quote: acmePaid._id,
        },
        acmeOverdue: {
            user: userId,
            customer: acme._id,
            invoiceNumber: `INV-${fmt(new Date(nowTs - 30 * 86400000))}-1001`,
            issueDate: new Date(nowTs - 30 * 86400000),
            dueDate: new Date(nowTs - 10 * 86400000),
            status: "unpaid",
            items: acmeOverdue.items,
            quote: acmeOverdue._id,
        },
    }
}
