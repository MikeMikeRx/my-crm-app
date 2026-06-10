import { describe, it, expect } from "vitest";
import { calcTotals } from "./calcTotals";

describe("calcTotals", () => {
    it("returns zero totals for empty items", () => {
        expect(calcTotals([])).toEqual({ subtotal: 0, taxTotal: 0, total: 0 });
    });

    it("returns zero totals when called with no argument", () => {
        expect(calcTotals()).toEqual({ subtotal: 0, taxTotal: 0, total: 0 });
    });

    it("calculates correctly for a single item with 0% tax", () => {
        const result = calcTotals([{ quantity: 3, unitPrice: 100, taxRate: 0 }]);
        expect(result.subtotal).toBe(300);
        expect(result.taxTotal).toBe(0);
        expect(result.total).toBe(300);
    });

    it("calculates correctly for a single item with tax", () => {
        const result = calcTotals([{ quantity: 2, unitPrice: 50, taxRate: 20 }]);
        expect(result.subtotal).toBe(100);
        expect(result.taxTotal).toBe(20);
        expect(result.total).toBe(120);
    });

    it("calculates correctly for multiple items with mixed tax rates", () => {
        const result = calcTotals([
            { quantity: 1, unitPrice: 200, taxRate: 10 },
            { quantity: 4, unitPrice: 25, taxRate: 0 },
            { quantity: 2, unitPrice: 50, taxRate: 21 },
        ]);
        // subtotals: 200 + 100 + 100 = 400
        // tax: 20 + 0 + 21 = 41
        expect(result.subtotal).toBe(400);
        expect(result.taxTotal).toBeCloseTo(41);
        expect(result.total).toBeCloseTo(441);
    });

    it("treats missing quantity/unitPrice/taxRate as 0", () => {
        const result = calcTotals([{ description: "x" } as never]);
        expect(result).toEqual({ subtotal: 0, taxTotal: 0, total: 0 });
    });
});
