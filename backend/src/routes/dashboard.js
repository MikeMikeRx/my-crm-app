import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getDashboardSummary } from "../controllers/dashboardController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/summary", getDashboardSummary);

export default router;
