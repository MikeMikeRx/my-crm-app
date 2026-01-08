import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getDashboardSummary } from "../controllers/dashboardController.js";

const router = express.Router();

// ============================================================================
// DASHBOARD ROUTES
// ============================================================================
// Provides aggregated analytics and summary data for the dashboard
// All routes require authentication (applied globally below)

// Apply authentication to all dashboard routes
router.use(authMiddleware);

// ============================================================================
// GET /api/dashboard/summary
// ============================================================================
// Get comprehensive dashboard summary for authenticated user
// Returns:
// - Invoice summary (total, monthly count/sum, status breakdown, recent invoices)
// - Quote summary (total, monthly count/sum, status breakdown, recent quotes)
// - Payment summary (total, monthly count/sum, status breakdown, due balance)
// - Customer summary (total, new this month, active/inactive breakdown)
// - Customer details (with invoices, quotes, payments, outstanding balance)
router.get("/summary", getDashboardSummary);

export default router;
