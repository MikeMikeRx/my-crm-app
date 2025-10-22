import express from "express"
import { resiterUser, loginUser, getProfile } from "../controllers/authController"
import { authMiddleware } from "../middleware/auth"