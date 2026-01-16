import request from "supertest";
import app from "../src/app.js";

describe("Auth API", () => {
  const userPayload = {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  };

  it("registers a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(userPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe(userPayload.email);
  });

  it("logs in a user and returns token", async () => {
    await request(app)
      .post("/api/auth/register")
      .send(userPayload);

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: userPayload.email,
        password: userPayload.password,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("blocks protected route without token", async () => {
    const res = await request(app).get("/api/customers");
    expect(res.statusCode).toBe(401);
  });
});
