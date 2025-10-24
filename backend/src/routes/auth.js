import express from "express"
import { registerUser, loginUser, getProfile } from "../controllers/authController.js"
import { authMiddleware } from "../middleware/auth.js"

const router = express.Router()

router.post("/register", registerUser)
router.post("/login", loginUser)
router.post("/profile", authMiddleware, getProfile)

export default router