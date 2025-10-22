import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/User"

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

        res.status(201).json({
            message: "User registered successfully",
            user: { id: user._id, name: user.name, email: user.email },
        })
    } catch (err) {
        next (err)
    }
}