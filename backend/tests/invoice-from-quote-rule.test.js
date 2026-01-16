import request from "supertest";
import app from "../src/app.js";
import { registerAndLogin } from "./helpers.js";

describe("Business rule: invoice from quote", () => {
  let token;

  beforeEach(async () => {
    token = await registerAndLogin();
  });

  it("rejects invoice creation from declined quote", async () => {
    // 1) Create customer (quotes require customer)
    const c = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "ACME" });

    const customerId = c.body._id;

    // 2) Create declined quote
    const q = await request(app)
      .post("/api/quotes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customer: customerId,
        quoteNumber: "Q-20260116-1001",
        issueDate: "2026-01-16",
        expiryDate: "2027-01-16",
        status: "declined",
        items: [{ description: "Item", quantity: 1, unitPrice: 100, taxRate: 20 }],
        notes: "test",
      });

    const quoteId = q.body._id;

    // 3) Try create invoice linked to declined quote
    const inv = await request(app)
      .post("/api/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customer: customerId,
        quote: quoteId,
        invoiceNumber: "INV-20260116-XXXX",
        issueDate: "2026-01-16",
        dueDate: "2026-01-30",
        items: [{ description: "Item", quantity: 1, unitPrice: 100, taxRate: 20 }],
        notes: "test",
      });

    expect(inv.statusCode).toBe(400); // or 409 depending on your API
  });
});
