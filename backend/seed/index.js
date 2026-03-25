import Customer from "../src/models/Customer.js"
import Quote from "../src/models/Quote.js"
import Invoice from "../src/models/Invoice.js"
import Payment from "../src/models/Payment.js"

import { getCustomers } from "./customers.js"
import { getQuotes } from "./quotes.js"
import { getInvoices } from "./invoices.js"
import { getPayments } from "./payments.js"

async function createAll(Model, dataMap) {
    const entries = await Promise.all(
        Object.entries(dataMap).map(async ([key, data]) => {
            const doc = new Model(data)
            await doc.save()
            return [key, doc]
        })
    )
    return Object.fromEntries(entries)
}

export async function seedDemoData(userId, tenantId) {
    await Promise.all([
        Payment.deleteMany({ tenant: tenantId }),
        Invoice.deleteMany({ tenant: tenantId }),
        Quote.deleteMany({ tenant: tenantId }),
        Customer.deleteMany({ tenant: tenantId }),
    ])

    const customers = await createAll(Customer, getCustomers(userId, tenantId))
    const quotes = await createAll(Quote, getQuotes(userId, tenantId, customers))
    const invoices = await createAll(Invoice, getInvoices(userId, tenantId, customers, quotes))
    await createAll(Payment, getPayments(userId, tenantId, invoices))

    await Invoice.updateMany(
        { _id: { $in: [invoices.novaUnpaid._id, invoices.acmeUnpaid._id] } },
        { status: "partially_paid" }
    )
}
