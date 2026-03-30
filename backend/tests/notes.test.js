import request from "supertest";
import app from "../src/app.js";
import Activity from "../src/models/Activity.js";
import { registerAndLogin } from "./helpers.js";

async function registerAndLoginAs(name) {
  const email = `t${Date.now()}-${Math.random()}@test.com`;
  const password = "password123";
  await request(app).post("/api/auth/register").send({ name, email, password });
  const login = await request(app).post("/api/auth/login").send({ email, password });
  return login.body.data.token;
}

async function createCustomer(token) {
  const res = await request(app)
    .post("/api/customers")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Note Test Co", email: `n${Date.now()}@test.com`, phone: "0", company: "NTC", address: "1 St" });
  return res.body.data;
}

async function postNote(token, payload) {
  return request(app)
    .post("/api/activities/notes")
    .set("Authorization", `Bearer ${token}`)
    .send(payload);
}

describe("Notes — creation", () => {
  let token;

  beforeEach(async () => {
    token = await registerAndLogin();
  });

  it("creates a note attached to an owned customer", async () => {
    const customer = await createCustomer(token);

    const res = await postNote(token, {
      entityType: "customer",
      entityId: customer._id,
      message: "Called customer, left voicemail",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe("note");
    expect(res.body.data.action).toBe("note_added");
    expect(res.body.data.entityType).toBe("customer");
    expect(res.body.data.entityId).toBe(customer._id);
    expect(res.body.data.message).toBe("Called customer, left voicemail");

    const saved = await Activity.findById(res.body.data._id);
    expect(saved).not.toBeNull();
    expect(saved.type).toBe("note");
  });

  it("rejects an invalid entityType", async () => {
    const res = await postNote(token, {
      entityType: "contract",
      entityId: "000000000000000000000001",
      message: "Some note",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid entitytype/i);
  });

  it("rejects when required fields are missing", async () => {
    const res = await postNote(token, { entityType: "customer" });

    expect(res.status).toBe(400);
  });

  it("returns 404 for a valid entityType but non-existent entityId", async () => {
    const res = await postNote(token, {
      entityType: "customer",
      entityId: "000000000000000000000001",
      message: "Ghost entity",
    });

    expect(res.status).toBe(404);
  });
});

describe("Notes — entity coverage", () => {
  let token;
  let quoteId;
  let invoiceId;
  let paymentId;

  beforeEach(async () => {
    token = await registerAndLogin();

    const customer = await createCustomer(token);

    const quoteRes = await request(app)
      .post("/api/quotes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customer: customer._id,
        quoteNumber: `Q-${Date.now()}-${Math.random()}`,
        issueDate: "2026-01-01",
        expiryDate: "2027-12-31",
        status: "accepted",
        items: [{ description: "Item", quantity: 1, unitPrice: 100, taxRate: 20 }],
      });
    quoteId = quoteRes.body.data._id;

    const invoiceRes = await request(app)
      .post("/api/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customer: customer._id,
        quote: quoteId,
        invoiceNumber: `INV-${Date.now()}-${Math.random()}`,
        issueDate: "2026-01-01",
        dueDate: "2027-12-31",
        items: [{ description: "Item", quantity: 1, unitPrice: 100, taxRate: 20 }],
      });
    invoiceId = invoiceRes.body.data._id;

    await request(app)
      .patch(`/api/invoices/${invoiceId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "sent" });

    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        invoice: invoiceId,
        amount: 50,
        paymentMethod: "cash",
        paymentId: `PAY-${Date.now()}`,
      });
    paymentId = paymentRes.body.data._id;
  });

  it("creates a note attached to a quote", async () => {
    const res = await postNote(token, {
      entityType: "quote",
      entityId: quoteId,
      message: "Customer confirmed receipt",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.entityType).toBe("quote");
    expect(res.body.data.entityId).toBe(quoteId);
  });

  it("creates a note attached to an invoice", async () => {
    const res = await postNote(token, {
      entityType: "invoice",
      entityId: invoiceId,
      message: "Invoice sent via email",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.entityType).toBe("invoice");
    expect(res.body.data.entityId).toBe(invoiceId);
  });

  it("creates a note attached to a payment", async () => {
    const res = await postNote(token, {
      entityType: "payment",
      entityId: paymentId,
      message: "Verified via bank statement",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.entityType).toBe("payment");
    expect(res.body.data.entityId).toBe(paymentId);
  });
});

describe("Notes — cross-tenant rejection", () => {
  it("returns 404 when attaching a note to another tenant's entity", async () => {
    const ownerToken = await registerAndLoginAs("Owner User");
    const attackerToken = await registerAndLoginAs("Attacker User");

    const customer = await createCustomer(ownerToken);

    const res = await postNote(attackerToken, {
      entityType: "customer",
      entityId: customer._id,
      message: "Cross-tenant note attempt",
    });

    expect(res.status).toBe(404);
  });
});
