import request from "supertest";
import app from "../src/app.js";
import { registerAndLogin } from "./helpers.js";

const ITEM = { description: "Widget", quantity: 1, unitPrice: 100, taxRate: 20 };

async function createInvoiceWithDeps(token) {
  const customer = await request(app)
    .post("/api/customers")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Test Co", email: "co@test.com", phone: "0", company: "TC", address: "1 St" });

  const quote = await request(app)
    .post("/api/quotes")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customer: customer.body._id,
      quoteNumber: `Q-${Date.now()}-${Math.random()}`,
      issueDate: "2026-01-01",
      expiryDate: "2026-12-31",
      status: "accepted",
      items: [ITEM],
    });

  const invoice = await request(app)
    .post("/api/invoices")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customer: customer.body._id,
      quote: quote.body._id,
      invoiceNumber: `INV-${Date.now()}`,
      issueDate: "2026-01-01",
      dueDate: "2026-12-31",
      items: [ITEM],
    });

  await request(app)
    .patch(`/api/invoices/${invoice.body._id}/status`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: "sent" });

  return invoice.body;
}

describe("Payments — tax-inclusive total", () => {
  let token;

  beforeEach(async () => {
    token = await registerAndLogin();
  });

  it("does NOT mark invoice paid when only subtotal is covered (old bug)", async () => {
    const invoice = await createInvoiceWithDeps(token);

    // Pay subtotal only (100), tax (20) still outstanding
    await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ invoice: invoice._id, amount: 100, paymentMethod: "cash", paymentId: `PAY-${Date.now()}-1` });

    const updated = await request(app)
      .get(`/api/invoices/${invoice._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(updated.body.status).not.toBe("paid");
    expect(updated.body.status).toBe("partially_paid");
  });

  it("marks invoice paid when full tax-inclusive total is covered", async () => {
    const invoice = await createInvoiceWithDeps(token);

    await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ invoice: invoice._id, amount: 120, paymentMethod: "cash", paymentId: `PAY-${Date.now()}-1` });

    const updated = await request(app)
      .get(`/api/invoices/${invoice._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(updated.body.status).toBe("paid");
  });

  it("marks invoice paid when split payments together cover full total", async () => {
    const invoice = await createInvoiceWithDeps(token);

    const ts = Date.now();
    // First payment: 80
    await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ invoice: invoice._id, amount: 80, paymentMethod: "cash", paymentId: `PAY-${ts}-1` });

    // Second payment: 40 (total 120, covers tax too)
    await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ invoice: invoice._id, amount: 40, paymentMethod: "cash", paymentId: `PAY-${ts}-2` });

    const updated = await request(app)
      .get(`/api/invoices/${invoice._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(updated.body.status).toBe("paid");
  });

  it("rejects payment with amount 0", async () => {
    const invoice = await createInvoiceWithDeps(token);

    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ invoice: invoice._id, amount: 0, paymentMethod: "cash" });

    expect(res.statusCode).toBe(400);
  });
});
