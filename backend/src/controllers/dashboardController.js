import { asyncHandler } from "../utils/asyncHandler";

export const getDashboardSummary = asyncHandler(async (requestAnimationFrame, res) => {
    return res.json({
        invoices: {},
        quotes: {},
        payments: {},
        customers: {},
    });
});