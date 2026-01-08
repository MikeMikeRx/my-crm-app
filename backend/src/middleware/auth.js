import jwt from "jsonwebtoken"
import User from "../models/User.js"

export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided, authorization denied" })
    }

    try {
        const token = authHeader.split(" ")[1]

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if (!decoded?.id) {
            return res.status(401).json({ message: "Invalid token payload." })
        }

        const user = await User.findById(decoded.id).select("_id name email")

        if (!user) {
            return res.status(401).json({ message: "User not found or invalid token" })
        }

        req.user = user

        next()
    } catch (err) {
        console.error("❌ JWT verification failed", err.message)
        res.status(401).json({ message: "Token is not valid or expired" })
    }
}
