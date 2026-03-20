import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../src/models/User.js";
import Customer from "../src/models/Customer.js";
import Quote from "../src/models/Quote.js";
import Invoice from "../src/models/Invoice.js";
import Payment from "../src/models/Payment.js";
import { DEMO_USER } from "../seed/users.js";
import { seedDemoData } from "../seed/index.js";

if (process.env.NODE_ENV !== "production") {
  const dotenv = await import("dotenv");
  dotenv.config();
}

const DATABASE = process.env.DATABASE;
if (!DATABASE) {
  throw new Error("DATABASE is not set");
}

async function seed() {
  await mongoose.connect(DATABASE);
  console.log("Connected to DB");

  try {
    await Promise.all([
      Payment.deleteMany({}),
      Invoice.deleteMany({}),
      Quote.deleteMany({}),
      Customer.deleteMany({}),
      User.deleteMany({ email: DEMO_USER.email }),
    ]);

    const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);
    const user = await User.create({
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      password: passwordHash,
      role: DEMO_USER.role,
    });

    await seedDemoData(user._id);

    console.log("Demo data seeded successfully");
    console.log("Demo login:");
    console.log(`Email: ${DEMO_USER.email}`);
    console.log(`Password: ${DEMO_USER.password}`);
  } catch (err) {
    console.error("Seed failed!", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
