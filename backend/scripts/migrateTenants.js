import mongoose from "mongoose";
import User from "../src/models/User.js";
import Tenant from "../src/models/Tenant.js";
import Membership from "../src/models/Membership.js";

if (process.env.NODE_ENV !== "production") {
    const dotenv = await import("dotenv");
    dotenv.config({ path: new URL("../.env", import.meta.url) });
}

const DATABASE = process.env.DATABASE
if (!DATABASE) {
    throw new Error("DATABASE is not set");
}

function slugify(name, email) {
    const base = name || email?.split("@")[0] || "tenant";
    const slug = base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return slug || "tenant";
}

async function ensureUniqueSlug(baseSlug) {
    let slug = baseSlug;
    let suffix = 1;
    while (await Tenant.exists({ slug })) {
        slug = `${baseSlug}-${suffix}`;
        suffix++;
    }
    return slug || "tenant";
}

async function migrate() {
    await mongoose.connect(DATABASE);
    console.log("Connected to DB");

    try {
        const users = await User.find({});
        console.log(`Found ${users.length} user(s)`);

        let created = 0;
        let skipped = 0;

        for (const user of users) {
            const existing = await Membership.findOne({ user: user._id })
            if (existing) {
                console.log(`  skip  ${user.email} — membership already exists`);
                skipped++;
                continue;
            }

            const existingTenant = await Tenant.findOne({ owner: user._id });

            if (existingTenant) {
                await Membership.create({
                    user: user._id,
                    tenant: existingTenant._id,
                    role: "owner",
                });
                console.log(`  linked existing tenant "${existingTenant.slug}" for ${user.email}`);
                skipped++;
                continue;
            }

            const baseSlug = slugify(user.name, user.email);
            const slug = await ensureUniqueSlug(baseSlug);

            const tenant = await Tenant.create({
                name: user.name || user.email,
                slug,
                owner: user._id,
            });

            await Membership.create({
                user: user._id,
                tenant: tenant._id,
                role: "owner",
            });

            console.log(`  created tenant "${slug}" for ${user.email}`);
            created++;
        }

        console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
    } catch (err) {
        console.error("Migration failed!", err);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

migrate();
