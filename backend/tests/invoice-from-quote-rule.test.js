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

    customerId = c.body._id;
  });

  async function createQuote(status) {
    const q = await request(app)
      .post("/api/quotes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customer: customerId,
        quoteNumber: `Q-${Date.now()}`,
        issueDate: "2026-01-16",
        expiryDate: "2027-01-16",
        status,
        items: [{ description: "Item", quantity: 1, unitPrice: 100, taxRate: 20 }],
        notes: "test",
      });
    return q.body._id;
  }

  async function tryCreateInvoice(quoteId) {
    return request(app)
      .post("/api/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customer: customerId,
        quote: quoteId,
        invoiceNumber: `INV-${Date.now()}`,
        issueDate: "2026-01-16",
        dueDate: "2026-01-30",
        items: [{ description: "Item", quantity: 1, unitPrice: 100, taxRate: 20 }],
        notes: "test",
      });
  }

  it("rejects invoice creation from a draft quote", async () => {
    const quoteId = await createQuote("draft");
    const inv = await tryCreateInvoice(quoteId);
    expect(inv.statusCode).toBe(400);
  });

  it("rejects invoice creation from a declined quote", async () => {
    const quoteId = await createQuote("declined");
    const inv = await tryCreateInvoice(quoteId);
    expect(inv.statusCode).toBe(400);
  });

  it("allows invoice creation from a sent quote", async () => {
    const quoteId = await createQuote("sent");
    const inv = await tryCreateInvoice(quoteId);
    expect(inv.statusCode).toBe(201);
  });

  it("allows invoice creation from an accepted quote", async () => {
    const quoteId = await createQuote("accepted");
    const inv = await tryCreateInvoice(quoteId);
    expect(inv.statusCode).toBe(201);
  });
});
