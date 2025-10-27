import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/User.js"

export const registerUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" })
        }

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({ name, email, password: hashedPassword })

        const token = jwt.sign(
            { id: user_.id, email: user.email },
            process.env.JWTF_SECRET,
            { expiresIn: "1d" }
        )

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: { id: user._id, name: user.name, email: user.email },
        })
    } catch (err) {
        next (err)
    }
}

export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" })
        }

        const user = await User.findOne({ email })
        if(!user) {
            return res.status(401).json({ message: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" })
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1d"}
        )

        res.json({
            message: "Login successful",
            token,
            user: { id: user._id, name: user.name, email: user.email },
        })
    } catch (err) {
        next(err)
    }
}

export const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select("-password")

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        
        res.json(user)
    } catch (err) {
        next(err)
    }
}