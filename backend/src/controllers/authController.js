import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import Membership from "../models/Membership.js"
import Tenant from "../models/Tenant.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { seedDemoData } from "../../seed/index.js"

const generateAuthToken = (user, tenantId, membershipRole) =>
    jwt.sign({ id: user._id, email: user.email, role: user.role, tenant: tenantId, membershipRole }, process.env.JWT_SECRET, { expiresIn: "1d" })

export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body

    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "user",
    })

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || email.split("@")[0]
    const tenant = await Tenant.create({ name, slug, owner: user._id })
    const membership = await Membership.create({ user: user._id, tenant: tenant._id, role: "owner" })

    const token = generateAuthToken(user, tenant._id, membership.role)

    res.status(201).json({
        message: "User registered successfully",
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        tenant: { id: tenant._id, name: tenant.name, slug: tenant.slug },
    })
})

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" })
    }

    const user = await User.findOne({ email }).select("+password")
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" })
    }

    const membership = await Membership.findOne({ user: user._id }).populate("tenant", "name slug")
    if (!membership) {
        return res.status(403).json({ message: "No tenant membership found" })
    }

    const token = generateAuthToken(user, membership.tenant._id, membership.role)

    res.json({
        message: "Login successful",
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        tenant: { id: membership.tenant._id, name: membership.tenant.name, slug: membership.tenant.slug },
    })
})

export const loginDemo = asyncHandler(async (_req, res) => {
    const user = await User.findOne({ email: "demo@vitesse.app" })
    if (!user) {
        return res.status(404).json({ message: "Demo account not found" })
    }

    let membership = await Membership.findOne({ user: user._id }).populate("tenant", "name slug")
    if (!membership) {
        const tenant = await Tenant.create({ name: user.name, slug: "demo-user", owner: user._id })
        membership = await Membership.create({ user: user._id, tenant: tenant._id, role: "owner" })
        await membership.populate("tenant", "name slug")
    }

    try {
        await seedDemoData(user._id, membership.tenant._id)
    } catch (err) {
        console.error("Demo seed failed:", err.message)
    }

    const token = generateAuthToken(user, membership.tenant._id, membership.role)

    res.json({
        message: "Demo login successful",
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        tenant: { id: membership.tenant._id, name: membership.tenant.name, slug: membership.tenant.slug },
    })
})

export const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select("-password")

    if (!user) {
        return res.status(404).json({ message: "User not found" })
    }

    res.json(user)
})
