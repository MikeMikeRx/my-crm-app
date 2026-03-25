const fmt = (d) => d.toISOString().slice(0, 10).replace(/-/g, "")

export function getPayments(userId, tenantId, { novaUnpaid, acmeUnpaid, acmePaid }) {
    const nowTs = Date.now()
    const now = new Date(nowTs)
    const today = fmt(now)

    return {
        novaPartial: {
            user: userId,
            tenant: tenantId,
            invoice: novaUnpaid._id,
            amount: 2000,
            paymentMethod: "bank_transfer",
            paymentId: `PAY-${fmt(new Date(nowTs - 2 * 86400000))}-001`,
            paymentDate: new Date(nowTs - 2 * 86400000),
            notes: "First installment",
        },
        acmePartial: {
            user: userId,
            tenant: tenantId,
            invoice: acmeUnpaid._id,
            amount: 200,
            paymentMethod: "bank_transfer",
            paymentId: `PAY-${today}-001`,
            paymentDate: now,
            notes: "Partial payment",
        },
        acmeFull: {
            user: userId,
            tenant: tenantId,
            invoice: acmePaid._id,
            amount: acmePaid.totals.total,
            paymentMethod: "card",
            paymentId: `PAY-${fmt(new Date(nowTs - 5 * 86400000))}-001`,
            paymentDate: new Date(nowTs - 5 * 86400000),
            notes: "Paid in full by card",
        },
    }
}
