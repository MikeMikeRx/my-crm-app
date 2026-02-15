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

const fmt = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");

async function seed() {
  try {
    await mongoose.connect(DATABASE);
    console.log("Connected to DB");

    const now = new Date();
    const today = fmt(now);

    const existingUser = await User.findOne({ email: "demo@vitesse.app" });
    if (existingUser) {
      console.log("Demo user already exists. Skipping seed.");
      process.exit(0);
    }

    await Promise.all([
      Customer.deleteMany(),
      Quote.deleteMany(),
      Invoice.deleteMany(),
      Payment.deleteMany(),
    ]);

    // User
    const passwordHash = await bcrypt.hash("demo123", 10);
    const user = await User.create({
      name: "Demo User",
      email: "demo@vitesse.app",
      password: passwordHash,
      role: "admin",
    });

    // Customers
    const customer = await Customer.create({
      user: user._id,
      name: "James Whitfield",
      email: "j.whitfield@acme.com",
      phone: "+1 555 123 456",
      company: "ACME Corp",
      address: "123 Business St, New York, NY 10001",
    });

    const customerNova = await Customer.create({
      user: user._id,
      name: "Sarah Chen",
      email: "sarah.chen@novadigital.io",
      phone: "+1 415 987 3210",
      company: "Nova Digital LLC",
      address: "742 Innovation Blvd, San Francisco, CA 94107",
    });

    const customerStellar = await Customer.create({
      user: user._id,
      name: "Marcus Webb",
      email: "m.webb@stellardynamics.com",
      phone: "+44 20 7946 0958",
      company: "Stellar Dynamics Ltd",
      address: "88 Kingsway, London WC2B 6AA, UK",
    });

    // Quote – ACME: accepted (for unpaid invoice)
    const quote = await Quote.create({
      user: user._id,
      customer: customer._id,
      quoteNumber: `Q-${today}-1001`,
      issueDate: new Date(),
      expiryDate: new Date(Date.now() + 14 * 86400000),
      status: "accepted",
      items: [
        { description: "Consulting", quantity: 5, unitPrice: 100, taxRate: 20 },
      ],
      notes: "Initial proposal",
    });

    // Quote – ACME: draft
    const quoteDraft = await Quote.create({
      user: user._id,
      customer: customer._id,
      quoteNumber: `Q-${today}-1002`,
      issueDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 86400000),
      status: "draft",
      items: [
        { description: "Design work", quantity: 10, unitPrice: 80, taxRate: 20 },
      ],
      notes: "Draft quote",
    });

    // Quote – ACME: declined
    const quoteDeclined = await Quote.create({
      user: user._id,
      customer: customer._id,
      quoteNumber: `Q-${today}-1003`,
      issueDate: new Date(),
      expiryDate: new Date(Date.now() + 7 * 86400000),
      status: "declined",
      items: [
        { description: "Maintenance", quantity: 3, unitPrice: 150, taxRate: 20 },
      ],
      notes: "Client declined this offer",
    });

    // Quote – ACME: accepted (for paid invoice)
    const quotePaid = await Quote.create({
      user: user._id,
      customer: customer._id,
      quoteNumber: `Q-${fmt(new Date(Date.now() - 15 * 86400000))}-1001`,
      issueDate: new Date(Date.now() - 15 * 86400000),
      expiryDate: new Date(Date.now() - 5 * 86400000),
      status: "accepted",
      items: [
        { description: "Website build", quantity: 1, unitPrice: 2000, taxRate: 20 },
      ],
      notes: "Website project accepted",
    });

    // Quote – ACME: sent (pending client response)
    const quoteSent = await Quote.create({
      user: user._id,
      customer: customer._id,
      quoteNumber: `Q-${fmt(new Date(Date.now() - 3 * 86400000))}-1001`,
      issueDate: new Date(Date.now() - 3 * 86400000),
      expiryDate: new Date(Date.now() + 11 * 86400000),
      status: "sent",
      items: [
        { description: "Monthly support", quantity: 1, unitPrice: 500, taxRate: 20 },
      ],
      notes: "Support contract accepted",
    });

    // Quote – Nova Digital: accepted
    const quoteNova = await Quote.create({
      user: user._id,
      customer: customerNova._id,
      quoteNumber: `Q-${fmt(new Date(Date.now() - 20 * 86400000))}-1001`,
      issueDate: new Date(Date.now() - 20 * 86400000),
      expiryDate: new Date(Date.now() - 6 * 86400000),
      status: "accepted",
      items: [
        { description: "Mobile app prototype", quantity: 1, unitPrice: 4500, taxRate: 20 },
        { description: "UX research sessions", quantity: 3, unitPrice: 350, taxRate: 20 },
      ],
      notes: "Phase 1 mobile app development",
    });

    // Invoice – Nova Digital: unpaid
    const invoiceNova = await Invoice.create({
      user: user._id,
      customer: customerNova._id,
      invoiceNumber: `INV-${fmt(new Date(Date.now() - 5 * 86400000))}-1001`,
      issueDate: new Date(Date.now() - 5 * 86400000),
      dueDate: new Date(Date.now() + 9 * 86400000),
      status: "unpaid",
      items: quoteNova.items,
      quote: quoteNova._id,
    });

    // Payment – Nova Digital: partial
    await Payment.create({
      user: user._id,
      invoice: invoiceNova._id,
      amount: 2000,
      paymentMethod: "bank_transfer",
      paymentId: `PAY-${fmt(new Date(Date.now() - 2 * 86400000))}-001`,
      paymentDate: new Date(Date.now() - 2 * 86400000),
      notes: "First installment",
    });

    // Invoice – ACME: unpaid
    const invoice = await Invoice.create({
      user: user._id,
      customer: customer._id,
      invoiceNumber: `INV-${today}-1001`,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 86400000),
      status: "unpaid",
      items: quote.items,
      quote: quote._id,
    });

    // Invoice – ACME: paid
    const invoicePaid = await Invoice.create({
      user: user._id,
      customer: customer._id,
      invoiceNumber: `INV-${fmt(new Date(Date.now() - 10 * 86400000))}-1001`,
      issueDate: new Date(Date.now() - 10 * 86400000),
      dueDate: new Date(Date.now() - 2 * 86400000),
      status: "paid",
      items: quotePaid.items,
      quote: quotePaid._id,
    });

    // Invoice – ACME: overdue (unpaid, past due date)
    const invoiceOverdue = await Invoice.create({
      user: user._id,
      customer: customer._id,
      invoiceNumber: `INV-${fmt(new Date(Date.now() - 30 * 86400000))}-1001`,
      issueDate: new Date(Date.now() - 30 * 86400000),
      dueDate: new Date(Date.now() - 10 * 86400000),
      status: "unpaid",
      items: quoteSent.items,
      quote: quoteSent._id,
    });

    // Payment – ACME: partial
    await Payment.create({
      user: user._id,
      invoice: invoice._id,
      amount: 200,
      paymentMethod: "bank_transfer",
      paymentId: `PAY-${today}-001`,
      paymentDate: new Date(),
      notes: "Partial payment",
    });

    // Payment – ACME: full payment
    await Payment.create({
      user: user._id,
      invoice: invoicePaid._id,
      amount: invoicePaid.totals.total,
      paymentMethod: "card",
      paymentId: `PAY-${fmt(new Date(Date.now() - 5 * 86400000))}-001`,
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
