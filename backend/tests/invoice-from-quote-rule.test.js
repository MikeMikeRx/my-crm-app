import request from "supertest";
import app from "../src/app.js";
import { registerAndLogin } from "./helpers.js";

describe("Business rule: invoice from quote", () => {
  let token;
  let customerId;

  beforeEach(async () => {
    token = await registerAndLogin();

    const c = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "ACME" });

    customerId = c.body.data._id;
  });

  async function createQuote(status) {
    const q = await request(app)
      .post("/api/quotes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customer: customerId,
        quoteNumber: `Q-${Date.now()}-${Math.random()}`,
        issueDate: "2026-01-16",
        expiryDate: "2027-01-16",
        status,
        items: [{ description: "Item", quantity: 1, unitPrice: 100, taxRate: 20 }],
        notes: "test",
      });
    return q.body.data._id;
  }

  async function tryCreateInvoice(quoteId) {
    return request(app)
      .post("/api/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customer: customerId,
        quote: quoteId,
        invoiceNumber: `INV-${Date.now()}-${Math.random()}`,
        issueDate: "2026-01-16",
        dueDate: "2026-01-30",
        items: [{ description: "Item", quantity: 1, unitPrice: 100, taxRate: 20 }],
        notes: "test",
      });
  }

  describe("Rejected statuses", () => {
    it("rejects invoice creation from a draft quote", async () => {
      const quoteId = await createQuote("draft");
      const inv = await tryCreateInvoice(quoteId);
      expect(inv.statusCode).toBe(409);
    });

    it("rejects invoice creation from a sent quote", async () => {
      const quoteId = await createQuote("sent");
      const inv = await tryCreateInvoice(quoteId);
      expect(inv.statusCode).toBe(409);
    });

    it("rejects invoice creation from a declined quote", async () => {
      const quoteId = await createQuote("declined");
      const inv = await tryCreateInvoice(quoteId);
      expect(inv.statusCode).toBe(409);
    });

    it("rejects invoice creation from an expired quote", async () => {
      const q = await request(app)
        .post("/api/quotes")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customer: customerId,
          quoteNumber: `Q-${Date.now()}-${Math.random()}`,
          issueDate: "2020-01-01",
          expiryDate: "2020-06-01",
          status: "sent",
          items: [{ description: "Item", quantity: 1, unitPrice: 100, taxRate: 20 }],
        });
      const inv = await tryCreateInvoice(q.body._id);
      expect(inv.statusCode).toBe(400);
    });

    it("rejects invoice creation from an accepted-but-expired quote", async () => {
      const q = await request(app)
        .post("/api/quotes")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customer: customerId,
          quoteNumber: `Q-${Date.now()}-${Math.random()}`,
          issueDate: "2020-01-01",
          expiryDate: "2020-06-01",
          status: "accepted",
          items: [{ description: "Item", quantity: 1, unitPrice: 100, taxRate: 20 }],
        });
      const inv = await tryCreateInvoice(q.body._id);
      expect(inv.statusCode).toBe(400);
    });

    it("rejects invoice creation from a converted quote", async () => {
      const quoteId = await createQuote("accepted");
      await tryCreateInvoice(quoteId);
      const inv = await tryCreateInvoice(quoteId);
      expect(inv.statusCode).toBe(409);
    });
  });

  describe("Successful conversion", () => {
    it("allows invoice creation from an accepted quote", async () => {
      const quoteId = await createQuote("accepted");
      const inv = await tryCreateInvoice(quoteId);
      expect(inv.statusCode).toBe(201);
    });

    it("quote status becomes converted after invoice creation", async () => {
      const quoteId = await createQuote("accepted");
      await tryCreateInvoice(quoteId);

      const quote = await request(app)
        .get(`/api/quotes/${quoteId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(quote.body.data.status).toBe("converted");
    });

    it("rejects duplicate invoice creation from the same accepted quote", async () => {
      const quoteId = await createQuote("accepted");
      const first = await tryCreateInvoice(quoteId);
      expect(first.statusCode).toBe(201);

      const second = await tryCreateInvoice(quoteId);
      expect(second.statusCode).toBe(409);
    });
  });
});
