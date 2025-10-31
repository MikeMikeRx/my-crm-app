import express from "express"
import { authMiddleware } from "../middleware/auth.js"
import { authorizeRoles } from "../middleware/authRoles.js"

const router = express.Router()

// admin-only check route
router.get(
    "/stats",
    authMiddleware,
    authorizeRoles("admin"),
    (req, res) => {
        res.json({
            message: `Admin acces verified for ${req.user.name}`,
            role: req.user.role,
            serverTime: new Date().toISOString(),
        })
    }
)

// more admin-only routes here

export default router