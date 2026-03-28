import request from "supertest";
import app from "../src/app.js";
import Activity from "../src/models/Activity.js";
import { registerAndLogin } from "./helpers.js";

async function registerAndLoginAs(name) {
  const email = `t${Date.now()}-${Math.random()}@test.com`;
  const password = "password123";
  await request(app).post("/api/auth/register").send({ name, email, password });
  const login = await request(app).post("/api/auth/login").send({ email, password });
  return login.body.token;
}

async function createCustomer(token) {
  const res = await request(app)
    .post("/api/customers")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Note Test Co", email: `n${Date.now()}@test.com`, phone: "0", company: "NTC", address: "1 St" });
  return res.body;
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
    expect(res.body.type).toBe("note");
    expect(res.body.action).toBe("note_added");
    expect(res.body.entityType).toBe("customer");
    expect(res.body.entityId).toBe(customer._id);
    expect(res.body.message).toBe("Called customer, left voicemail");

    const saved = await Activity.findById(res.body._id);
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
