import request from "supertest";
import app from "../src/app.js";
import { registerAndLogin } from "./helpers.js";

const ITEM = { description: "Widget", quantity: 2, unitPrice: 100, taxRate: 10 };

async function seed(token) {
  const customer = await request(app)
    .post("/api/customers")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Acme", email: "acme@test.com", phone: "0", company: "Acme Ltd", address: "1 St" });

  const quote = await request(app)
    .post("/api/quotes")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customer: customer.body.data._id,
      quoteNumber: `Q-${Date.now()}-${Math.random()}`,
      issueDate: new Date().toISOString().slice(0, 10),
      expiryDate: "2027-12-31",
      status: "accepted",
      items: [ITEM],
    });

  const invoice = await request(app)
    .post("/api/invoices")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customer: customer.body.data._id,
      quote: quote.body.data._id,
      invoiceNumber: `INV-${Date.now()}`,
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: "2027-12-31",
      items: [ITEM],
    });

  await request(app)
    .patch(`/api/invoices/${invoice.body.data._id}/status`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: "sent" });

  const payment = await request(app)
    .post("/api/payments")
    .set("Authorization", `Bearer ${token}`)
    .send({
      invoice: invoice.body.data._id,
      amount: 110, // partial — total is 220 (2 * 100 + 10%)
      paymentMethod: "cash",
      paymentId: `PAY-${Date.now()}`,
    });

  return { customer: customer.body.data, quote: quote.body.data, invoice: invoice.body.data, payment: payment.body.data };
}

describe("GET /api/dashboard/summary", () => {
  let token;
  let seeded;

  beforeEach(async () => {
    token = await registerAndLogin();
    seeded = await seed(token);
  });

  it("returns 200 with the expected top-level keys", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      invoices: expect.any(Object),
      quotes: expect.any(Object),
      payments: expect.any(Object),
      customers: expect.any(Object),
      customerDetails: expect.any(Array),
      customerMaxValues: expect.any(Object),
      recentInvoices: expect.any(Array),
      recentQuotes: expect.any(Array),
    });
  });

  it("invoice summary counts are correct", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);

    const { invoices } = res.body;
    expect(invoices.total).toBe(1);
    expect(invoices.monthCount).toBe(1);
    expect(invoices.totalSum).toBe(220); // 2 * 100 * 1.1
  });

  it("payment summary includes dueBalance", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);

    const { payments } = res.body;
    expect(payments.total).toBe(1);
    expect(payments.totalSum).toBe(110);
    expect(payments.dueBalance).toBe(110); // 220 - 110
  });

  it("customer summary marks seeded customer as active", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);

    const { customers, customerDetails } = res.body;
    expect(customers.total).toBe(1);
    expect(customers.active).toBe(1);

    const detail = customerDetails.find(c => c._id === seeded.customer._id);
    expect(detail).toBeDefined();
    expect(detail.isActive).toBe(true);
    expect(detail.invoices).toBe(1);
    expect(detail.quotes).toBe(1);
    expect(detail.outstanding).toBe(110);
  });

  it("recentInvoices preview has correct shape", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);

    const [inv] = res.body.recentInvoices;
    expect(inv).toMatchObject({
      _id: expect.any(String),
      number: expect.any(String),
      total: 220,
      status: expect.any(String),
    });
  });

  it("requires authentication", async () => {
    const res = await request(app).get("/api/dashboard/summary");
    expect(res.statusCode).toBe(401);
  });
});
