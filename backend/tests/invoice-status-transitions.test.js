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

  return invoice.body;
}

describe("Invoice status transitions", () => {
  let token;

  beforeEach(async () => {
    token = await registerAndLogin();
  });

  describe("Initial state", () => {
    it("creates invoice with draft status", async () => {
      const invoice = await createInvoiceWithDeps(token);
      expect(invoice.status).toBe("draft");
    });
  });

  describe("Valid transitions", () => {
    it("draft → sent", async () => {
      const invoice = await createInvoiceWithDeps(token);

      const res = await request(app)
        .patch(`/api/invoices/${invoice._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "sent" });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("sent");
    });

    it("sent → paid (manual)", async () => {
      const invoice = await createInvoiceWithDeps(token);

      await request(app)
        .patch(`/api/invoices/${invoice._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "sent" });

      const res = await request(app)
        .patch(`/api/invoices/${invoice._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "paid" });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("paid");
    });

    it("partially_paid → paid (manual)", async () => {
      const invoice = await createInvoiceWithDeps(token);
      const ts = Date.now();

      await request(app)
        .patch(`/api/invoices/${invoice._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "sent" });

      // Partial payment auto-transitions to partially_paid
      await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ invoice: invoice._id, amount: 60, paymentMethod: "cash", paymentId: `PAY-${ts}-1` });

      const res = await request(app)
        .patch(`/api/invoices/${invoice._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "paid" });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("paid");
    });
  });

  describe("Invalid transitions", () => {
    it("rejects draft → paid", async () => {
      const invoice = await createInvoiceWithDeps(token);

      const res = await request(app)
        .patch(`/api/invoices/${invoice._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "paid" });

      expect(res.statusCode).toBe(400);
    });

    it("rejects draft → partially_paid", async () => {
      const invoice = await createInvoiceWithDeps(token);

      const res = await request(app)
        .patch(`/api/invoices/${invoice._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "partially_paid" });

      expect(res.statusCode).toBe(400);
    });

    it("rejects sent → draft", async () => {
      const invoice = await createInvoiceWithDeps(token);

      await request(app)
        .patch(`/api/invoices/${invoice._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "sent" });

      const res = await request(app)
        .patch(`/api/invoices/${invoice._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "draft" });

      expect(res.statusCode).toBe(400);
    });

    it("rejects paid → sent", async () => {
      const invoice = await createInvoiceWithDeps(token);

      await request(app)
        .patch(`/api/invoices/${invoice._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "sent" });

      await request(app)
        .patch(`/api/invoices/${invoice._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "paid" });

      const res = await request(app)
        .patch(`/api/invoices/${invoice._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "sent" });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("Edit lock", () => {
    it("allows editing a draft invoice", async () => {
      const invoice = await createInvoiceWithDeps(token);
      const customerId = invoice.customer._id ?? invoice.customer;
      const quoteId = invoice.quote?._id ?? invoice.quote;

      const res = await request(app)
        .put(`/api/invoices/${invoice._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          customer: customerId,
          quote: quoteId,
          invoiceNumber: invoice.invoiceNumber,
          issueDate: "2026-02-01",
          dueDate: "2026-12-31",
          items: [ITEM],
        });

      expect(res.statusCode).toBe(200);
    });

    it("blocks editing a sent invoice", async () => {
      const invoice = await createInvoiceWithDeps(token);
      const customerId = invoice.customer._id ?? invoice.customer;

      await request(app)
        .patch(`/api/invoices/${invoice._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "sent" });

      const res = await request(app)
        .put(`/api/invoices/${invoice._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          customer: customerId,
          invoiceNumber: invoice.invoiceNumber,
          issueDate: "2026-02-01",
          dueDate: "2026-12-31",
          items: [ITEM],
        });

      expect(res.statusCode).toBe(400);
    });

    it("blocks editing a paid invoice", async () => {
      const invoice = await createInvoiceWithDeps(token);
      const customerId = invoice.customer._id ?? invoice.customer;

      await request(app)
        .patch(`/api/invoices/${invoice._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "sent" });

      await request(app)
        .patch(`/api/invoices/${invoice._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "paid" });

      const res = await request(app)
        .put(`/api/invoices/${invoice._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          customer: customerId,
          invoiceNumber: invoice.invoiceNumber,
          issueDate: "2026-02-01",
          dueDate: "2026-12-31",
          items: [ITEM],
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("Payment guards", () => {
    it("blocks payment on a draft invoice", async () => {
      const invoice = await createInvoiceWithDeps(token);

      const res = await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ invoice: invoice._id, amount: 60, paymentMethod: "cash", paymentId: `PAY-${Date.now()}` });

      expect(res.statusCode).toBe(400);
    });

    it("blocks payment on a paid invoice", async () => {
      const invoice = await createInvoiceWithDeps(token);

      await request(app)
        .patch(`/api/invoices/${invoice._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "sent" });

      await request(app)
        .patch(`/api/invoices/${invoice._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "paid" });

      const res = await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ invoice: invoice._id, amount: 60, paymentMethod: "cash", paymentId: `PAY-${Date.now()}` });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("Payment auto-transitions", () => {
    it("partial payment transitions sent → partially_paid", async () => {
      const invoice = await createInvoiceWithDeps(token);

      await request(app)
        .patch(`/api/invoices/${invoice._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "sent" });

      await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ invoice: invoice._id, amount: 60, paymentMethod: "cash", paymentId: `PAY-${Date.now()}` });

      const updated = await request(app)
        .get(`/api/invoices/${invoice._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(updated.body.status).toBe("partially_paid");
    });

    it("full payment transitions sent → paid", async () => {
      const invoice = await createInvoiceWithDeps(token);

      await request(app)
        .patch(`/api/invoices/${invoice._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "sent" });

      await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ invoice: invoice._id, amount: 120, paymentMethod: "cash", paymentId: `PAY-${Date.now()}` });

      const updated = await request(app)
        .get(`/api/invoices/${invoice._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(updated.body.status).toBe("paid");
    });

    it("final payment transitions partially_paid → paid", async () => {
      const invoice = await createInvoiceWithDeps(token);
      const ts = Date.now();

      await request(app)
        .patch(`/api/invoices/${invoice._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "sent" });

      await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ invoice: invoice._id, amount: 60, paymentMethod: "cash", paymentId: `PAY-${ts}-1` });

      await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ invoice: invoice._id, amount: 60, paymentMethod: "cash", paymentId: `PAY-${ts}-2` });

      const updated = await request(app)
        .get(`/api/invoices/${invoice._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(updated.body.status).toBe("paid");
    });
  });
});
