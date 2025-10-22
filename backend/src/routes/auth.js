import express from "express"
import { registerUser, loginUser, getProfile } from "../controllers/authController"
import { authMiddleware } from "../middleware/auth"

const router = express.Router()

router.post("/register", registerUser)
router.post("/login", loginUser)
router.post("/profile", authMiddleware, getProfile)

export default router