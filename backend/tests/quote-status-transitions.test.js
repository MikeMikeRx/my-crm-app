import request from "supertest";
import app from "../src/app.js";
import { registerAndLogin } from "./helpers.js";

const ITEM = { description: "Widget", quantity: 1, unitPrice: 100, taxRate: 20 };

async function createCustomer(token) {
  const res = await request(app)
    .post("/api/customers")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Test Co", email: "co@test.com", phone: "0", company: "TC", address: "1 St" });
  return res.body.data._id;
}

async function createQuote(token, customerId, { status = "draft", expiryDate = "2027-12-31" } = {}) {
  const res = await request(app)
    .post("/api/quotes")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customer: customerId,
      quoteNumber: `Q-${Date.now()}-${Math.random()}`,
      issueDate: "2026-01-01",
      expiryDate,
      status,
      items: [ITEM],
    });
  return res.body.data;
}

async function transition(token, quoteId, status) {
  return request(app)
    .patch(`/api/quotes/${quoteId}/status`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status });
}

describe("Quote status transitions", () => {
  let token;
  let customerId;

  beforeEach(async () => {
    token = await registerAndLogin();
    customerId = await createCustomer(token);
  });

  describe("Valid transitions", () => {
    it("draft → sent", async () => {
      const quote = await createQuote(token, customerId, { status: "draft" });
      const res = await transition(token, quote._id, "sent");
      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe("sent");
    });

    it("sent → accepted", async () => {
      const quote = await createQuote(token, customerId, { status: "sent" });
      const res = await transition(token, quote._id, "accepted");
      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe("accepted");
    });

    it("sent → declined", async () => {
      const quote = await createQuote(token, customerId, { status: "sent" });
      const res = await transition(token, quote._id, "declined");
      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe("declined");
    });

    it("sent → expired", async () => {
      const quote = await createQuote(token, customerId, { status: "sent" });
      const res = await transition(token, quote._id, "expired");
      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe("expired");
    });
  });

  describe("Invalid transitions", () => {
    it("rejects draft → accepted", async () => {
      const quote = await createQuote(token, customerId, { status: "draft" });
      const res = await transition(token, quote._id, "accepted");
      expect(res.statusCode).toBe(400);
    });

    it("rejects draft → declined", async () => {
      const quote = await createQuote(token, customerId, { status: "draft" });
      const res = await transition(token, quote._id, "declined");
      expect(res.statusCode).toBe(400);
    });

    it("rejects sent → draft (no backward transitions)", async () => {
      const quote = await createQuote(token, customerId, { status: "sent" });
      const res = await transition(token, quote._id, "draft");
      expect(res.statusCode).toBe(400);
    });

    it("rejects accepted → declined", async () => {
      const quote = await createQuote(token, customerId, { status: "accepted" });
      const res = await transition(token, quote._id, "declined");
      expect(res.statusCode).toBe(400);
    });

    it("rejects manual transition to converted", async () => {
      const quote = await createQuote(token, customerId, { status: "sent" });
      const res = await request(app)
        .patch(`/api/quotes/${quote._id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "converted" });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("Terminal state guards", () => {
    it("expired quote cannot be accepted", async () => {
      const quote = await createQuote(token, customerId, { status: "sent", expiryDate: "2020-01-01" });
      const res = await transition(token, quote._id, "accepted");
      expect(res.statusCode).toBe(400);
    });

    it("declined quote cannot be accepted later", async () => {
      const quote = await createQuote(token, customerId, { status: "sent" });
      await transition(token, quote._id, "declined");
      const res = await transition(token, quote._id, "accepted");
      expect(res.statusCode).toBe(400);
    });

    it("expired quote cannot be declined", async () => {
      const quote = await createQuote(token, customerId, { status: "sent", expiryDate: "2020-01-01" });
      const res = await transition(token, quote._id, "declined");
      expect(res.statusCode).toBe(400);
    });
  });

  describe("Converted quote edit lock", () => {
    it("converted quote cannot be edited", async () => {
      const quote = await createQuote(token, customerId, { status: "accepted" });

      await request(app)
        .post("/api/invoices")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customer: customerId,
          quote: quote._id,
          invoiceNumber: `INV-${Date.now()}`,
          issueDate: "2026-01-01",
          dueDate: "2026-12-31",
          items: [ITEM],
        });

      const res = await request(app)
        .put(`/api/quotes/${quote._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          customer: customerId,
          quoteNumber: quote.quoteNumber,
          issueDate: "2026-02-01",
          expiryDate: "2027-12-31",
          items: [ITEM],
        });

      expect(res.statusCode).toBe(400);
    });

    it("converted quote cannot be deleted", async () => {
      const quote = await createQuote(token, customerId, { status: "accepted" });

      await request(app)
        .post("/api/invoices")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customer: customerId,
          quote: quote._id,
          invoiceNumber: `INV-${Date.now()}`,
          issueDate: "2026-01-01",
          dueDate: "2026-12-31",
          items: [ITEM],
        });

      const res = await request(app)
        .delete(`/api/quotes/${quote._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(409);
    });

    it("converted quote cannot be transitioned", async () => {
      const quote = await createQuote(token, customerId, { status: "accepted" });

      await request(app)
        .post("/api/invoices")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customer: customerId,
          quote: quote._id,
          invoiceNumber: `INV-${Date.now()}`,
          issueDate: "2026-01-01",
          dueDate: "2026-12-31",
          items: [ITEM],
        });

      const res = await transition(token, quote._id, "accepted");
      expect(res.statusCode).toBe(400);
    });
  });
});
