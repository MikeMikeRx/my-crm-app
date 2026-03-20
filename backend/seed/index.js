import mongoose from "mongoose"
import Customer from "../src/models/Customer.js"
import Quote from "../src/models/Quote.js"
import Invoice from "../src/models/Invoice.js"
import Payment from "../src/models/Payment.js"

import { getCustomers } from "./customers.js"
import { getQuotes } from "./quotes.js"
import { getInvoices } from "./invoices.js"
import { getPayments } from "./payments.js"

async function createAll(Model, dataMap, session) {
    const entries = await Promise.all(
        Object.entries(dataMap).map(async ([key, data]) => {
            const doc = new Model(data)
            await doc.save({ session })
            return [key, doc]
        })
    )
    return Object.fromEntries(entries)
}

export async function seedDemoData(userId) {
    const session = await mongoose.startSession()
    try {
        await session.withTransaction(async () => {
            await Promise.all([
                Payment.deleteMany({ user: userId }, { session }),
                Invoice.deleteMany({ user: userId }, { session }),
                Quote.deleteMany({ user: userId }, { session }),
                Customer.deleteMany({ user: userId }, { session }),
            ])

            const customers = await createAll(Customer, getCustomers(userId), session)
            const quotes = await createAll(Quote, getQuotes(userId, customers), session)
            const invoices = await createAll(Invoice, getInvoices(userId, customers, quotes), session)
            await createAll(Payment, getPayments(userId, invoices), session)

            await Invoice.updateMany(
                { _id: { $in: [invoices.novaUnpaid._id, invoices.acmeUnpaid._id] } },
                { status: "partially_paid" },
                { session }
            )
        })
    } finally {
        await session.endSession()
    }
}
