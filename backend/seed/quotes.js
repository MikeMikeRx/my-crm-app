const fmt = (d) => d.toISOString().slice(0, 10).replace(/-/g, "")

export function getQuotes(userId, { acme, nova }) {
    const nowTs = Date.now()
    const now = new Date(nowTs)
    const today = fmt(now)

    return {
        acmeAccepted: {
            user: userId,
            customer: acme._id,
            quoteNumber: `Q-${today}-1001`,
            issueDate: now,
            expiryDate: new Date(nowTs + 14 * 86400000),
            status: "accepted",
            items: [{ description: "Consulting", quantity: 5, unitPrice: 100, taxRate: 20 }],
            notes: "Initial proposal",
        },
        acmeDraft: {
            user: userId,
            customer: acme._id,
            quoteNumber: `Q-${today}-1002`,
            issueDate: now,
            expiryDate: new Date(nowTs + 30 * 86400000),
            status: "draft",
            items: [{ description: "Design work", quantity: 10, unitPrice: 80, taxRate: 20 }],
            notes: "Draft quote",
        },
        acmeDeclined: {
            user: userId,
            customer: acme._id,
            quoteNumber: `Q-${today}-1003`,
            issueDate: now,
            expiryDate: new Date(nowTs + 7 * 86400000),
            status: "declined",
            items: [{ description: "Maintenance", quantity: 3, unitPrice: 150, taxRate: 20 }],
            notes: "Client declined this offer",
        },
        acmePaid: {
            user: userId,
            customer: acme._id,
            quoteNumber: `Q-${fmt(new Date(nowTs - 15 * 86400000))}-1001`,
            issueDate: new Date(nowTs - 15 * 86400000),
            expiryDate: new Date(nowTs - 5 * 86400000),
            status: "accepted",
            items: [{ description: "Website build", quantity: 1, unitPrice: 2000, taxRate: 20 }],
            notes: "Website project accepted",
        },
        acmeOverdue: {
            user: userId,
            customer: acme._id,
            quoteNumber: `Q-${fmt(new Date(nowTs - 35 * 86400000))}-1001`,
            issueDate: new Date(nowTs - 35 * 86400000),
            expiryDate: new Date(nowTs - 25 * 86400000),
            status: "accepted",
            items: [{ description: "Monthly support", quantity: 1, unitPrice: 500, taxRate: 20 }],
            notes: "Support contract",
        },
        acmeSent: {
            user: userId,
            customer: acme._id,
            quoteNumber: `Q-${fmt(new Date(nowTs - 3 * 86400000))}-1002`,
            issueDate: new Date(nowTs - 3 * 86400000),
            expiryDate: new Date(nowTs + 11 * 86400000),
            status: "sent",
            items: [{ description: "Annual retainer", quantity: 1, unitPrice: 3600, taxRate: 20 }],
            notes: "Awaiting client response",
        },
        novaAccepted: {
            user: userId,
            customer: nova._id,
            quoteNumber: `Q-${fmt(new Date(nowTs - 20 * 86400000))}-1001`,
            issueDate: new Date(nowTs - 20 * 86400000),
            expiryDate: new Date(nowTs - 6 * 86400000),
            status: "accepted",
            items: [
                { description: "Mobile app prototype", quantity: 1, unitPrice: 4500, taxRate: 20 },
                { description: "UX research sessions", quantity: 3, unitPrice: 350, taxRate: 20 },
            ],
            notes: "Phase 1 mobile app development",
        },
    }
}
