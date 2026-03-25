import mongoose from "mongoose";
import Membership from "../src/models/Membership.js";
import Customer from "../src/models/Customer.js";
import Invoice from "../src/models/Invoice.js";
import Quote from "../src/models/Quote.js";
import Payment from "../src/models/Payment.js";

if (process.env.NODE_ENV !== "production") {
    const dotenv = await import("dotenv");
    dotenv.config({ path: new URL("../.env", import.meta.url) });
}

const DATABASE = process.env.DATABASE;
if (!DATABASE) {
    throw new Error("DATABASE is not set");
}

async function backfillCollection(Model, label) {
    const docs = await Model.find({ tenant: { $exists: false } });
    console.log(`${label}: ${docs.length} doc(s) to backfill`);

    let updated = 0;
    let skipped = 0;

    for (const doc of docs) {
        const membership = await Membership.findOne({ user: doc.user });
        if (!membership) {
            console.log(`  skip  ${doc._id} — no membership for user ${doc.user}`);
            skipped++;
            continue;
        }

        await Model.updateOne({ _id: doc._id }, { $set: { tenant: membership.tenant } });
        updated++;
    }

    console.log(`  updated: ${updated}, skipped: ${skipped}`);
}

async function migrate() {
    await mongoose.connect(DATABASE);
    console.log("Connected to DB\n");

    try {
        await backfillCollection(Customer, "Customer");
        await backfillCollection(Invoice, "Invoice");
        await backfillCollection(Quote, "Quote");
        await backfillCollection(Payment, "Payment");

        console.log("\nDone.");
    } catch (err) {
        console.error("Backfill failed!", err);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

migrate();