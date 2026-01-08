import express from "express"
import { authMiddleware } from "../middleware/auth.js"
import { authorizeRoles } from "../middleware/authRoles.js"

const router = express.Router()

// ============================================================================
// ADMIN ROUTES
// ============================================================================
// All routes require authentication + admin role
// Protected by: authMiddleware → authorizeRoles("admin")
// NOTE: Admin functionality is currently minimal - prepared for future features

// ============================================================================
// GET /api/admin/stats
// ============================================================================
// Test endpoint to verify admin access
// Returns admin user info and server time
router.get(
    "/stats",
    authMiddleware,
    authorizeRoles("admin"),
    (req, res) => {
        res.json({
            message: `Admin access verified for ${req.user.name}`,
            role: req.user.role,
            serverTime: new Date().toISOString(),
        })
    }
)

export default router