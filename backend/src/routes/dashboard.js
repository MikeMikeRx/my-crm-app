import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";
import { getDashboardSummary } from "../controllers/dashboard/index.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/summary", requirePermission("dashboard", "read"), getDashboardSummary);

export default router;
