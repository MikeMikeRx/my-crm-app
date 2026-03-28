import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";

const TEST_SECRET = process.env.JWT_SECRET;

const userPayload = {
  name: "Role Test User",
  email: `role-test-${Date.now()}@test.com`,
  password: "password123",
};

function decodeToken(token) {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
}

describe("Auth — membershipRole in JWT", () => {
  it("register: JWT contains membershipRole = owner", async () => {
    const res = await request(app).post("/api/auth/register").send(userPayload);

    expect(res.statusCode).toBe(201);
    const payload = decodeToken(res.body.token);
    expect(payload.membershipRole).toBe("owner");
  });

  it("login: JWT contains membershipRole = owner", async () => {
    await request(app).post("/api/auth/register").send(userPayload);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: userPayload.email, password: userPayload.password });

    expect(res.statusCode).toBe(200);
    const payload = decodeToken(res.body.token);
    expect(payload.membershipRole).toBe("owner");
  });
});

describe("Auth middleware — old token without membershipRole", () => {
  it("rejects with 401 on a protected route", async () => {
    const legacyToken = jwt.sign(
      { id: "000000000000000000000001", email: "old@test.com", role: "user", tenant: "000000000000000000000002" },
      TEST_SECRET,
      { expiresIn: "1d" }
    );

    const res = await request(app)
      .get("/api/customers")
      .set("Authorization", `Bearer ${legacyToken}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/membershipRole/i);
  });
});

describe("Auth middleware — req.tenant.role populated", () => {
  it("valid token reaches the route handler (tenant role is accepted)", async () => {
    await request(app).post("/api/auth/register").send(userPayload);
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: userPayload.email, password: userPayload.password });

    const token = login.body.token;

    const res = await request(app)
      .get("/api/customers")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });

  it("token carries correct tenant role through to the route", async () => {
    await request(app).post("/api/auth/register").send(userPayload);
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: userPayload.email, password: userPayload.password });

    const payload = decodeToken(login.body.token);

    expect(payload.membershipRole).toBe("owner");
    expect(payload.tenant).toBeDefined();
  });
});
