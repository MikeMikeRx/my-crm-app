import request from "supertest";
import app from "../src/app.js";
import { registerAndLogin } from "./helpers.js";

describe("Customers API", () => {
  let token;

  beforeEach(async () => {
    token = await registerAndLogin();
  });

  it("creates a customer", async () => {
    const res = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "ACME",
        email: "acme@test.com",
        phone: "123",
        company: "ACME Corp",
        address: "Street 1",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("ACME");
  });

  it("lists customers", async () => {
    await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "ACME" });

    const res = await request(app)
      .get("/api/customers")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("blocks create without token", async () => {
    const res = await request(app).post("/api/customers").send({ name: "NoAuth" });
    expect(res.statusCode).toBe(401);
  });
});
