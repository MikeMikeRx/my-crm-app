import request from "supertest";
import app from "../src/app.js";

export async function registerAndLogin() {
  const email = `t${Date.now()}@test.com`;
  const password = "password123";

  await request(app).post("/api/auth/register").send({
    name: "Test User",
    email,
    password,
  });

  const login = await request(app).post("/api/auth/login").send({ email, password });

  return login.body.token;
}
