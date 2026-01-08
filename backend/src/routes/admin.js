import express from "express"
import { authMiddleware } from "../middleware/auth.js"
import { authorizeRoles } from "../middleware/authRoles.js"

const router = express.Router()

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