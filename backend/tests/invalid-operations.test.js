import request from "supertest";
import app from "../src/app.js";
import { registerAndLogin } from "./helpers.js";

const ITEM = { description: "Widget", quantity: 1, unitPrice: 100, taxRate: 20 };
const NONEXISTENT_ID = "000000000000000000000001";

async function createCustomer(token) {
  const res = await request(app)
    .post("/api/customers")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Test Co", email: `c${Date.now()}@test.com` });
  return res.body.data._id;
}

async function createAcceptedQuote(token, customerId) {
  const res = await request(app)
    .post("/api/quotes")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customer: customerId,
      quoteNumber: `Q-${Date.now()}-${Math.random()}`,
      issueDate: "2026-01-01",
      expiryDate: "2027-12-31",
      status: "accepted",
      items: [ITEM],
    });
  return res.body.data._id;
}

async function createSentInvoice(token) {
  const customerId = await createCustomer(token);
  const quoteId = await createAcceptedQuote(token, customerId);
  const invoiceRes = await request(app)
    .post("/api/invoices")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customer: customerId,
      quote: quoteId,
      invoiceNumber: `INV-${Date.now()}-${Math.random()}`,
      issueDate: "2026-01-01",
      dueDate: "2027-12-31",
      items: [ITEM],
    });
  await request(app)
    .patch(`/api/invoices/${invoiceRes.body.data._id}/status`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: "sent" });
  return invoiceRes.body.data;
}

describe("Invalid quote operations", () => {
  let token;

  beforeEach(async () => {
    token = await registerAndLogin();
  });

  it("rejects create with a non-existent customer ID", async () => {
    const res = await request(app)
      .post("/api/quotes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customer: NONEXISTENT_ID,
        quoteNumber: `Q-${Date.now()}`,
        issueDate: "2026-01-01",
        expiryDate: "2027-12-31",
        items: [ITEM],
      });
    expect(res.statusCode).toBe(400);
  });

  it("rejects create with empty items array", async () => {
    const customerId = await createCustomer(token);
    const res = await request(app)
      .post("/api/quotes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customer: customerId,
        quoteNumber: `Q-${Date.now()}`,
        issueDate: "2026-01-01",
        expiryDate: "2027-12-31",
        items: [],
      });
    expect(res.statusCode).toBe(400);
  });

  it("rejects create with missing expiry date", async () => {
    const customerId = await createCustomer(token);
    const res = await request(app)
      .post("/api/quotes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customer: customerId,
        quoteNumber: `Q-${Date.now()}`,
        issueDate: "2026-01-01",
        items: [ITEM],
      });
    expect(res.statusCode).toBe(400);
  });

  it("returns 404 for a non-existent quote", async () => {
    const res = await request(app)
      .get(`/api/quotes/${NONEXISTENT_ID}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});

describe("Invalid invoice operations", () => {
  let token;

  beforeEach(async () => {
    token = await registerAndLogin();
  });

  it("rejects create with a non-existent customer ID", async () => {
    const customerId = await createCustomer(token);
    const quoteId = await createAcceptedQuote(token, customerId);
    const res = await request(app)
      .post("/api/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customer: NONEXISTENT_ID,
        quote: quoteId,
        invoiceNumber: `INV-${Date.now()}`,
        issueDate: "2026-01-01",
        dueDate: "2027-12-31",
        items: [ITEM],
      });
    expect(res.statusCode).toBe(400);
  });

  it("rejects create with a non-existent quote ID", async () => {
    const customerId = await createCustomer(token);
    const res = await request(app)
      .post("/api/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customer: customerId,
        quote: NONEXISTENT_ID,
        invoiceNumber: `INV-${Date.now()}`,
        issueDate: "2026-01-01",
        dueDate: "2027-12-31",
        items: [ITEM],
      });
    expect(res.statusCode).toBe(400);
  });

  it("returns 404 for a non-existent invoice", async () => {
    const res = await request(app)
      .get(`/api/invoices/${NONEXISTENT_ID}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});

describe("Invalid payment operations", () => {
  let token;

  beforeEach(async () => {
    token = await registerAndLogin();
  });

  it("rejects payment amount exceeding invoice total", async () => {
    const invoice = await createSentInvoice(token);
    // Invoice total: 100 subtotal + 20% tax = 120
    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        invoice: invoice._id,
        amount: 200,
        paymentMethod: "cash",
        paymentId: `PAY-${Date.now()}`,
      });
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/exceed/i);
  });

  it("rejects second payment that would exceed the remaining balance", async () => {
    const invoice = await createSentInvoice(token);
    const ts = Date.now();
    // First payment covers most of the invoice
    await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ invoice: invoice._id, amount: 100, paymentMethod: "cash", paymentId: `PAY-${ts}-1` });

    // Second payment would push total beyond 120
    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ invoice: invoice._id, amount: 50, paymentMethod: "cash", paymentId: `PAY-${ts}-2` });
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/exceed/i);
  });

  it("rejects payment to a non-existent invoice", async () => {
    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        invoice: NONEXISTENT_ID,
        amount: 50,
        paymentMethod: "cash",
        paymentId: `PAY-${Date.now()}`,
      });
    expect(res.statusCode).toBe(400);
  });

  it("rejects payment with an invalid payment method", async () => {
    const invoice = await createSentInvoice(token);
    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        invoice: invoice._id,
        amount: 50,
        paymentMethod: "crypto",
        paymentId: `PAY-${Date.now()}`,
      });
    expect(res.statusCode).toBe(400);
  });

  it("returns 404 for a non-existent payment", async () => {
    const res = await request(app)
      .get(`/api/payments/${NONEXISTENT_ID}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});
