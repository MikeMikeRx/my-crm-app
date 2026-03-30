import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";

const SECRET = process.env.JWT_SECRET;

function decodeToken(token) {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
}

async function setupTokens() {
  const email = `rbac-${Date.now()}@test.com`;
  const password = "password123";

  await request(app).post("/api/auth/register").send({ name: "RBAC Owner", email, password });
  const login = await request(app).post("/api/auth/login").send({ email, password });
  const ownerToken = login.body.data.token;
  const { id: userId, tenant } = decodeToken(ownerToken);

  const memberToken = jwt.sign(
    { id: userId, email, role: "user", tenant, membershipRole: "member" },
    SECRET,
    { expiresIn: "1d" }
  );

  return { ownerToken, memberToken };
}

// ─── owner ────────────────────────────────────────────────────────────────────

describe("RBAC — owner: read access", () => {
  let ownerToken;

  beforeEach(async () => {
    ({ ownerToken } = await setupTokens());
  });

  it.each([
    ["customers",  "/api/customers"],
    ["quotes",     "/api/quotes"],
    ["invoices",   "/api/invoices"],
    ["payments",   "/api/payments"],
    ["dashboard",  "/api/dashboard/summary"],
  ])("can read %s", async (_, path) => {
    const res = await request(app).get(path).set("Authorization", `Bearer ${ownerToken}`);
    expect(res.statusCode).toBe(200);
  });
});

describe("RBAC — owner: write access", () => {
  let ownerToken;

  beforeEach(async () => {
    ({ ownerToken } = await setupTokens());
  });

  it.each([
    ["customers", "/api/customers"],
    ["quotes",    "/api/quotes"],
    ["invoices",  "/api/invoices"],
    ["payments",  "/api/payments"],
  ])("passes permission check on %s POST", async (_, path) => {
    const res = await request(app)
      .post(path)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({});
    expect(res.statusCode).not.toBe(403);
  });
});

// ─── member ───────────────────────────────────────────────────────────────────

describe("RBAC — member: read access", () => {
  let memberToken;

  beforeEach(async () => {
    ({ memberToken } = await setupTokens());
  });

  it.each([
    ["customers",  "/api/customers"],
    ["quotes",     "/api/quotes"],
    ["invoices",   "/api/invoices"],
    ["payments",   "/api/payments"],
    ["dashboard",  "/api/dashboard/summary"],
  ])("can read %s", async (_, path) => {
    const res = await request(app).get(path).set("Authorization", `Bearer ${memberToken}`);
    expect(res.statusCode).toBe(200);
  });
});

describe("RBAC — member: write access", () => {
  let memberToken;

  beforeEach(async () => {
    ({ memberToken } = await setupTokens());
  });

  it("passes permission check on customers POST", async () => {
    const res = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ name: "Test Customer" });
    expect(res.statusCode).toBe(201);
  });

  it("passes permission check on quotes POST", async () => {
    const res = await request(app)
      .post("/api/quotes")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it("cannot write invoices → 403", async () => {
    const res = await request(app)
      .post("/api/invoices")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({});
    expect(res.statusCode).toBe(403);
  });

  it("cannot write payments → 403", async () => {
    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({});
    expect(res.statusCode).toBe(403);
  });

  it("cannot PATCH invoice status → 403", async () => {
    const res = await request(app)
      .patch("/api/invoices/000000000000000000000001/status")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ status: "sent" });
    expect(res.statusCode).toBe(403);
  });
});

// ─── edge cases ───────────────────────────────────────────────────────────────

describe("RBAC — invalid or missing tenant role", () => {
  let validTenantId;

  beforeEach(async () => {
    const { ownerToken } = await setupTokens();
    ({ tenant: validTenantId } = decodeToken(ownerToken));
  });

  it("unknown membershipRole → 403", async () => {
    const badRoleToken = jwt.sign(
      { id: "000000000000000000000001", email: "x@test.com", role: "user", tenant: validTenantId, membershipRole: "superadmin" },
      SECRET,
      { expiresIn: "1d" }
    );
    const res = await request(app)
      .get("/api/customers")
      .set("Authorization", `Bearer ${badRoleToken}`);
    expect(res.statusCode).toBe(403);
  });

  it("missing membershipRole → 401", async () => {
    const legacyToken = jwt.sign(
      { id: "000000000000000000000001", email: "x@test.com", role: "user", tenant: validTenantId },
      SECRET,
      { expiresIn: "1d" }
    );
    const res = await request(app)
      .get("/api/customers")
      .set("Authorization", `Bearer ${legacyToken}`);
    expect(res.statusCode).toBe(401);
  });
});
