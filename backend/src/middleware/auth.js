import jwt from "jsonwebtoken"
import User from "../models/User.js"

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================
// Verifies JWT token and attaches user to request object
// Usage: Apply to protected routes that require authentication
export const authMiddleware = async (req, res, next) => {
    // ========================================================================
    // EXTRACT TOKEN FROM HEADER
    // ========================================================================
    // Expects Authorization header format: "Bearer <token>"
    const authHeader = req.headers.authorization

    // Check if token exists and has correct format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided, authorization denied" })
    }

    try {
        // ====================================================================
        // VERIFY TOKEN
        // ====================================================================
        // Extract token from "Bearer <token>" format
        const token = authHeader.split(" ")[1]

        // Verify token signature and decode payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // Validate token payload contains user ID
        if (!decoded?.id) {
            return res.status(401).json({ message: "Invalid token payload." })
        }

        // ====================================================================
        // FETCH USER
        // ====================================================================
        // Retrieve user from database using decoded ID
        // Only select essential fields (_id, name, email)
        const user = await User.findById(decoded.id).select("_id name email")

        // Check if user still exists in database
        if (!user) {
            return res.status(401).json({ message: "User not found or invalid token" })
        }

        // ====================================================================
        // ATTACH USER TO REQUEST
        // ====================================================================
        // Add user object to request for use in subsequent middleware/routes
        req.user = user

        // Continue to next middleware
        next()
    } catch (err) {
        // ====================================================================
        // HANDLE TOKEN ERRORS
        // ====================================================================
        // Catches: expired tokens, invalid signatures, malformed tokens
        console.error("❌ JWT verification failed", err.message)
        res.status(401).json({ message: "Token is not valid or expired" })
    }
}
