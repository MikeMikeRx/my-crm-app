import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// ============================================================================
// REGISTER USER
// ============================================================================
export const registerUser = asyncHandler(async (req, res, next) => {
    // ========================================================================
    // EXTRACT & VALIDATE INPUT
    // ========================================================================
    const { name, email, password, role } = req.body

    // Ensure all required fields are provided
    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" })
    }

    // ========================================================================
    // CHECK FOR EXISTING USER
    // ========================================================================
    const existingUser = await User.findOne({ email })
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" })
    }

    // ========================================================================
    // HASH PASSWORD & CREATE USER
    // ========================================================================
    // Hash password with bcrypt (salt rounds: 10)
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user in database
    // Role defaults to "user" unless explicitly set to "admin"
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role === "admin" ? "admin" : "user",
    })

    // ========================================================================
    // GENERATE JWT TOKEN
    // ========================================================================
    // Sign JWT with user ID and email, expires in 1 day
    const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.status(201).json({
        message: "User registered successfully",
        token,
        user: { id: user._id, name: user.name, email: user.email },
    })
})

// ============================================================================
// LOGIN USER
// ============================================================================
export const loginUser = asyncHandler(async (req, res, next) => {
    // ========================================================================
    // EXTRACT & VALIDATE INPUT
    // ========================================================================
    const { email, password } = req.body

    // Ensure both email and password are provided
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" })
    }

    // ========================================================================
    // FIND USER & VERIFY CREDENTIALS
    // ========================================================================
    // Find user by email and include password field (normally excluded)
    const user = await User.findOne({ email }).select("+password")
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" })
    }

    // Compare provided password with hashed password in database
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" })
    }

    // ========================================================================
    // GENERATE JWT TOKEN
    // ========================================================================
    // Sign JWT with user ID and email, expires in 1 day
    const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.json({
        message: "Login successful",
        token,
        user: { id: user._id, name: user.name, email: user.email },
    })
})

// ============================================================================
// GET USER PROFILE
// ============================================================================
export const getProfile = asyncHandler(async (req, res, next) => {
    // ========================================================================
    // FETCH USER DATA
    // ========================================================================
    // Find user by ID from authenticated request (set by auth middleware)
    // Exclude password field from response
    const user = await User.findById(req.user.id).select("-password")

    // Check if user exists
    if (!user) {
        return res.status(404).json({ message: "User not found" })
    }

    // ========================================================================
    // RESPONSE
    // ========================================================================
    res.json(user)
})