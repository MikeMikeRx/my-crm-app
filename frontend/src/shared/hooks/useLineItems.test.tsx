import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { useLineItems } from "./useLineItems";

type TestForm = {
    items: { description: string; quantity: number; unitPrice: number; taxRate?: number }[];
};

const ITEM_A = { description: "Widget", quantity: 2, unitPrice: 50, taxRate: 10 };
const ITEM_B = { description: "Gadget", quantity: 1, unitPrice: 100, taxRate: 0 };

function setup(defaultItems: TestForm["items"] = []) {
    return renderHook(() => {
        const { control } = useForm<TestForm>({
            defaultValues: { items: defaultItems },
        });
        return useLineItems(control);
    });
}

describe("useLineItems", () => {
    it("initializes with existing items", () => {
        const { result } = setup([ITEM_A, ITEM_B]);
        expect(result.current.fields).toHaveLength(2);
        expect(result.current.fields[0].description).toBe("Widget");
        expect(result.current.fields[1].description).toBe("Gadget");
    });

    it("calculates total from watched items", () => {
        // ITEM_A: 2 × 50 = 100, tax 10% = 10 → 110
        // ITEM_B: 1 × 100 = 100, tax 0% = 0 → 100
        const { result } = setup([ITEM_A, ITEM_B]);
        expect(result.current.total).toBe(210);
    });

    it("total is 0 when initialized with no items", () => {
        const { result } = setup([]);
        expect(result.current.total).toBe(0);
    });

    it("append adds a new line item", () => {
        const { result } = setup([ITEM_A]);
        act(() => {
            result.current.append(ITEM_B);
        });
        expect(result.current.fields).toHaveLength(2);
        expect(result.current.fields[1].description).toBe("Gadget");
    });

    it("remove deletes a line item by index", () => {
        const { result } = setup([ITEM_A, ITEM_B]);
        act(() => {
            result.current.remove(0);
        });
        expect(result.current.fields).toHaveLength(1);
        expect(result.current.fields[0].description).toBe("Gadget");
    });

    it("total recalculates correctly after append", () => {
        // ITEM_A: 2 × 50 = 100, tax 10% → 110
        const { result } = setup([ITEM_A]);
        expect(result.current.total).toBe(110);

        // ITEM_B: 1 × 100 = 100, tax 0% → 100; new total 210
        act(() => {
            result.current.append(ITEM_B);
        });
        expect(result.current.total).toBe(210);
    });

    it("total recalculates correctly after remove", () => {
        // ITEM_A: 110, ITEM_B: 100 → 210
        const { result } = setup([ITEM_A, ITEM_B]);
        expect(result.current.total).toBe(210);

        // remove ITEM_A → only ITEM_B remains: 100
        act(() => {
            result.current.remove(0);
        });
        expect(result.current.total).toBe(100);
    });

    it("columns are created with expected titles", () => {
        const { result } = setup([]);
        const titles = result.current.columns.map((c) => c.title);
        expect(titles).toEqual(["Description", "Qty", "Price", "Tax %", ""]);
    });

    it("each column has a render function", () => {
        const { result } = setup([]);
        for (const col of result.current.columns) {
            expect(typeof col.render).toBe("function");
        }
    });
});
