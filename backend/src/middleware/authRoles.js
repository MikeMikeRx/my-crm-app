// ============================================================================
// ROLE-BASED AUTHORIZATION MIDDLEWARE
// ============================================================================
// Restricts access based on user roles
// Usage: authorizeRoles("admin", "manager") - allows only specified roles
// Must be used AFTER authMiddleware (requires req.user)
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // ====================================================================
        // VERIFY AUTHENTICATION
        // ====================================================================
        // Check if user is authenticated (set by authMiddleware)
        if (!req.user) {
            return res.status(401).json({ message: "Not Authenticated" })
        }

        // ====================================================================
        // CHECK USER ROLE
        // ====================================================================
        // Verify user's role is in the list of allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied: insufficient permissions" })
        }

        // User has required role, continue to next middleware
        next()
    }
}
