import request from "supertest";
import app from "../src/app.js";
import Activity from "../src/models/Activity.js";
import { registerAndLogin } from "./helpers.js";

const ITEM = { description: "Widget", quantity: 1, unitPrice: 100, taxRate: 20 };

async function createCustomer(token) {
  const res = await request(app)
    .post("/api/customers")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Test Co", email: `c${Date.now()}@test.com`, phone: "0", company: "TC", address: "1 St" });
  return res.body.data;
}

async function createQuote(token, customerId, status = "draft") {
  const res = await request(app)
    .post("/api/quotes")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customer: customerId,
      quoteNumber: `Q-${Date.now()}-${Math.random()}`,
      issueDate: "2026-01-01",
      expiryDate: "2026-12-31",
      status,
      items: [ITEM],
    });
  return res.body.data;
}

async function createInvoice(token, customerId, quoteId = undefined) {
  const res = await request(app)
    .post("/api/invoices")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customer: customerId,
      quote: quoteId,
      invoiceNumber: `INV-${Date.now()}-${Math.random()}`,
      issueDate: "2026-01-01",
      dueDate: "2026-12-31",
      items: [ITEM],
    });
  return res.body.data;
}

describe("Activity — quote events", () => {
  let token;

  beforeEach(async () => {
    token = await registerAndLogin();
  });

  it("records quote_created when a quote is created", async () => {
    const customer = await createCustomer(token);
    const quote = await createQuote(token, customer._id);

    const activities = await Activity.find({ entityType: "quote", entityId: quote._id });
    expect(activities).toHaveLength(1);
    expect(activities[0].action).toBe("quote_created");
  });

  it("records quote_sent when quote transitions to sent", async () => {
    const customer = await createCustomer(token);
    const quote = await createQuote(token, customer._id, "draft");

    await request(app)
      .patch(`/api/quotes/${quote._id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "sent" });

    const activities = await Activity.find({ entityType: "quote", entityId: quote._id, action: "quote_sent" });
    expect(activities).toHaveLength(1);
  });

  it("records quote_accepted when quote transitions to accepted", async () => {
    const customer = await createCustomer(token);
    const quote = await createQuote(token, customer._id, "sent");

    await request(app)
      .patch(`/api/quotes/${quote._id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "accepted" });

    const activities = await Activity.find({ entityType: "quote", entityId: quote._id, action: "quote_accepted" });
    expect(activities).toHaveLength(1);
  });
});

describe("Activity — invoice events", () => {
  let token;

  beforeEach(async () => {
    token = await registerAndLogin();
  });

  it("records invoice_created when an invoice is created from a quote", async () => {
    const customer = await createCustomer(token);
    const quote = await createQuote(token, customer._id, "accepted");
    const invoice = await createInvoice(token, customer._id, quote._id);

    const activities = await Activity.find({ entityType: "invoice", entityId: invoice._id, action: "invoice_created" });
    expect(activities).toHaveLength(1);
  });

  it("records quote_converted and invoice_created when invoice is created from an accepted quote", async () => {
    const customer = await createCustomer(token);
    const quote = await createQuote(token, customer._id, "accepted");
    const invoice = await createInvoice(token, customer._id, quote._id);

    const invoiceActivities = await Activity.find({ entityType: "invoice", entityId: invoice._id });
    expect(invoiceActivities).toHaveLength(1);
    expect(invoiceActivities[0].action).toBe("invoice_created");

    const quoteActivities = await Activity.find({ entityType: "quote", entityId: quote._id, action: "quote_converted" });
    expect(quoteActivities).toHaveLength(1);
  });
});

describe("Activity — payment events", () => {
  let token;

  beforeEach(async () => {
    token = await registerAndLogin();
  });

  async function createSentInvoice(token) {
    const customer = await createCustomer(token);
    const quote = await createQuote(token, customer._id, "accepted");
    const invoice = await createInvoice(token, customer._id, quote._id);
    await request(app)
      .patch(`/api/invoices/${invoice._id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "sent" });
    return invoice;
  }

  it("records payment_created when a payment is made", async () => {
    const invoice = await createSentInvoice(token);

    const payment = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ invoice: invoice._id, amount: 50, paymentMethod: "cash", paymentId: `PAY-${Date.now()}` });

    const activities = await Activity.find({ entityType: "payment", entityId: payment.body.data._id });
    expect(activities).toHaveLength(1);
    expect(activities[0].action).toBe("payment_created");
  });

  it("records invoice_paid when payment covers the full invoice total", async () => {
    const invoice = await createSentInvoice(token);

    await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ invoice: invoice._id, amount: 120, paymentMethod: "cash", paymentId: `PAY-${Date.now()}` });

    const activities = await Activity.find({ entityType: "invoice", entityId: invoice._id, action: "invoice_paid" });
    expect(activities).toHaveLength(1);
  });

  it("does NOT record invoice_paid when payment is partial", async () => {
    const invoice = await createSentInvoice(token);

    await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ invoice: invoice._id, amount: 60, paymentMethod: "cash", paymentId: `PAY-${Date.now()}` });

    const activities = await Activity.find({ entityType: "invoice", entityId: invoice._id, action: "invoice_paid" });
    expect(activities).toHaveLength(0);
  });
});
