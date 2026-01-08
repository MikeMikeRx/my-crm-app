import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// REGISTER USER
export const registerUser = asyncHandler(async (req, res, next) => {
    const { name, email, password, role } = req.body

    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Role defaults to "user" unless explicitly set to "admin"
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role === "admin" ? "admin" : "user",
    })

    // Generate JWT
    const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.status(201).json({
        message: "User registered successfully",
        token,
        user: { id: user._id, name: user.name, email: user.email },
    })
})

// LOGIN USER
export const loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" })
    }

    // Password field normally excluded by model, must select explicitly
    const user = await User.findOne({ email }).select("+password")
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" })
    }

    // Generate JWT
    const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.json({
        message: "Login successful",
        token,
        user: { id: user._id, name: user.name, email: user.email },
    })
})

// GET USER PROFILE
export const getProfile = asyncHandler(async (req, res, next) => {
    // req.user.id set by auth middleware
    const user = await User.findById(req.user.id).select("-password")

    if (!user) {
        return res.status(404).json({ message: "User not found" })
    }

    res.json(user)
})
