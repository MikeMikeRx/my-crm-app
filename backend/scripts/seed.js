import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../src/models/User.js";
import Customer from "../src/models/Customer.js";
import Quote from "../src/models/Quote.js";
import Invoice from "../src/models/Invoice.js";
import Payment from "../src/models/Payment.js";

if (process.env.NODE_ENV !== "production") {
  const dotenv = await import("dotenv");
  dotenv.config();
}

const DATABASE = process.env.DATABASE;
if (!DATABASE) {
  throw new Error("DATABASE is not set");
}

async function seed() {
  try {
    await mongoose.connect(DATABASE);
    console.log("Connected to DB");

    // Seed-once guard
    const existingUser = await User.findOne({ email: "demo@vitesse.app" });
    if (existingUser) {
      console.log("Demo user already exists. Skipping seed.");
      process.exit(0);
    }

    // Clear ONLY demo-related collections (not users)
    await Promise.all([
      Customer.deleteMany(),
      Quote.deleteMany(),
      Invoice.deleteMany(),
      Payment.deleteMany(),
    ]);

    // Demo user
    const passwordHash = await bcrypt.hash("demo123", 10);
    const user = await User.create({
      name: "Demo User",
      email: "demo@vitesse.app",
      password: passwordHash,
      role: "admin",
    });

    // Customer
    const customer = await Customer.create({
      user: user._id,
      name: "ACME Corp",
      email: "contact@acme.com",
      phone: "+1 555 123 456",
      company: "ACME Corp",
      address: "123 Business St",
    });

    // Quote
    const quote = await Quote.create({
      user: user._id,
      customer: customer._id,
      quoteNumber: "Q-001",
      issueDate: new Date(),
      expiryDate: new Date(Date.now() + 14 * 86400000),
      status: "accepted",
      items: [
        { description: "Consulting", quantity: 5, unitPrice: 100, taxRate: 20 },
      ],
      notes: "Initial proposal",
    });

    // Quote – Draft (not converted)
    const quoteDraft = await Quote.create({
      user: user._id,
      customer: customer._id,
      quoteNumber: "Q-002",
      issueDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 86400000),
      status: "draft",
      items: [
        { description: "Design work", quantity: 10, unitPrice: 80, taxRate: 20 },
      ],
      notes: "Draft quote",
    });

    // Quote – Declined
    const quoteDeclined = await Quote.create({
      user: user._id,
      customer: customer._id,
      quoteNumber: "Q-003",
      issueDate: new Date(),
      expiryDate: new Date(Date.now() + 7 * 86400000),
      status: "declined",
      items: [
        { description: "Maintenance", quantity: 3, unitPrice: 150, taxRate: 20 },
      ],
      notes: "Client declined this offer",
    });

    // Quote – Accepted (for paid invoice)
    const quotePaid = await Quote.create({
      user: user._id,
      customer: customer._id,
      quoteNumber: "Q-004",
      issueDate: new Date(Date.now() - 15 * 86400000),
      expiryDate: new Date(Date.now() - 5 * 86400000),
      status: "accepted",
      items: [
        { description: "Website build", quantity: 1, unitPrice: 2000, taxRate: 20 },
      ],
      notes: "Website project accepted",
    });

    // Quote – Accepted (for overdue invoice)
    const quoteOverdue = await Quote.create({
      user: user._id,
      customer: customer._id,
      quoteNumber: "Q-005",
      issueDate: new Date(Date.now() - 35 * 86400000),
      expiryDate: new Date(Date.now() - 25 * 86400000),
      status: "accepted",
      items: [
        { description: "Monthly support", quantity: 1, unitPrice: 500, taxRate: 20 },
      ],
      notes: "Support contract accepted",
    });

    // Invoice
    const invoice = await Invoice.create({
      user: user._id,
      customer: customer._id,
      invoiceNumber: "INV-001",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 86400000),
      status: "unpaid",
      items: quote.items,
      quote: quote._id,
    });

    // Invoice – Paid
    const invoicePaid = await Invoice.create({
      user: user._id,
      customer: customer._id,
      invoiceNumber: "INV-002",
      issueDate: new Date(Date.now() - 10 * 86400000),
      dueDate: new Date(Date.now() - 2 * 86400000),
      status: "paid",
      items: quotePaid.items,
      quote: quotePaid._id,
    });

    // Invoice – Overdue (unpaid, past due date)
    const invoiceOverdue = await Invoice.create({
      user: user._id,
      customer: customer._id,
      invoiceNumber: "INV-003",
      issueDate: new Date(Date.now() - 30 * 86400000),
      dueDate: new Date(Date.now() - 10 * 86400000),
      status: "unpaid",
      items: quoteOverdue.items,
      quote: quoteOverdue._id,
    });

    // Payment
    await Payment.create({
      user: user._id,
      invoice: invoice._id,
      amount: 200,
      paymentMethod: "bank_transfer",
      paymentId: "PMT-001",
      paymentDate: new Date(),
      notes: "Partial payment",
    });

    // Payment – Full payment
    await Payment.create({
      user: user._id,
      invoice: invoicePaid._id,
      amount: invoicePaid.totals.total,
      paymentMethod: "card",
      paymentId: "PMT-002",
      paymentDate: new Date(Date.now() - 5 * 86400000),
      notes: "Paid in full by card",
    });

    console.log("Demo data seeded successfully");
    console.log("Demo login:");
    console.log("Email: demo@vitesse.app");
    console.log("Password: demo123");

    process.exit(0);
  } catch (err) {
    console.error("Seed failed!", err);
    process.exit(1);
  }
}

seed();