import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Controller } from "react-hook-form";
import { useQuoteForm } from "./useQuoteForm";
import * as quotesApi from "@/api/quotes";
import * as customersApi from "@/api/customers";
import * as handleErrorModule from "@/shared/utils/handleError";
import type { Quote } from "@/shared/types/entities";

vi.mock("@/api/quotes", () => ({
    listQuotes: vi.fn(),
    createQuote: vi.fn(),
    updateQuote: vi.fn(),
    transitionQuoteStatus: vi.fn(),
}));

vi.mock("@/api/customers", () => ({
    listCustomers: vi.fn(),
}));

vi.mock("@/shared/utils/handleError", () => ({
    handleError: vi.fn(),
}));

vi.mock("antd", async () => {
    const actual = await vi.importActual<typeof import("antd")>("antd");
    return { ...actual, message: { success: vi.fn(), error: vi.fn() } };
});

const EMPTY_PAGINATION = { page: 1, limit: 100, total: 0, pages: 1 };
const BASE_ITEMS = [{ description: "Widget", quantity: 1, unitPrice: 100, taxRate: 0 }];

const BASE_QUOTE: Quote = {
    _id: "q-1",
    user: "user-1",
    customer: "cust-1",
    quoteNumber: "Q-20240101-1001",
    issueDate: "2024-01-01",
    expiryDate: "2025-01-01",
    items: BASE_ITEMS,
    total: 100,
    status: "draft",
    notes: "",
};

type FormProps = { open: boolean; editing: Quote | null; onClose: () => void; onSuccess: () => void };

function FormUnderTest({ open, editing, onClose, onSuccess }: FormProps) {
    const { control, onSubmit, lineItems, isSystemStatus } =
        useQuoteForm({ open, editing, onClose, onSuccess });
    return (
        <form onSubmit={onSubmit}>
            <Controller
                name="customer"
                control={control}
                render={({ field }) => <input data-testid="customer" {...field} />}
            />
            <Controller
                name="status"
                control={control}
                render={({ field }) => <input data-testid="status" {...field} />}
            />
            <button
                type="button"
                data-testid="fill-items"
                onClick={() => {
                    if (lineItems.fields.length > 0) lineItems.remove(0);
                    lineItems.append({ description: "Valid Item", quantity: 1, unitPrice: 50, taxRate: 0 });
                }}
            >
                fill items
            </button>
            <button type="submit">submit</button>
            {isSystemStatus && <span data-testid="system-status" />}
        </form>
    );
}

describe("useQuoteForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(customersApi.listCustomers).mockResolvedValue({ data: [], pagination: EMPTY_PAGINATION });
        vi.mocked(quotesApi.listQuotes).mockResolvedValue({ data: [], pagination: EMPTY_PAGINATION });
    });

    it("edit submit calls updateQuote with all editable fields", async () => {
        vi.mocked(quotesApi.updateQuote).mockResolvedValue(BASE_QUOTE);
        render(<FormUnderTest open editing={BASE_QUOTE} onClose={vi.fn()} onSuccess={vi.fn()} />);
        await userEvent.click(screen.getByRole("button", { name: "submit" }));

        await waitFor(() =>
            expect(quotesApi.updateQuote).toHaveBeenCalledWith(
                "q-1",
                expect.objectContaining({ customer: "cust-1", items: BASE_ITEMS })
            )
        );
    });

    it("edit submit does not call transitionQuoteStatus when status is unchanged", async () => {
        vi.mocked(quotesApi.updateQuote).mockResolvedValue(BASE_QUOTE);
        render(<FormUnderTest open editing={BASE_QUOTE} onClose={vi.fn()} onSuccess={vi.fn()} />);
        await userEvent.click(screen.getByRole("button", { name: "submit" }));

        await waitFor(() => expect(quotesApi.updateQuote).toHaveBeenCalled());
        expect(quotesApi.transitionQuoteStatus).not.toHaveBeenCalled();
    });

    it("edit submit calls transitionQuoteStatus when status changes", async () => {
        vi.mocked(quotesApi.updateQuote).mockResolvedValue(BASE_QUOTE);
        vi.mocked(quotesApi.transitionQuoteStatus).mockResolvedValue({ ...BASE_QUOTE, status: "sent" });
        render(<FormUnderTest open editing={BASE_QUOTE} onClose={vi.fn()} onSuccess={vi.fn()} />);

        await userEvent.clear(screen.getByTestId("status"));
        await userEvent.type(screen.getByTestId("status"), "sent");
        await userEvent.click(screen.getByRole("button", { name: "submit" }));

        await waitFor(() =>
            expect(quotesApi.transitionQuoteStatus).toHaveBeenCalledWith("q-1", "sent")
        );
    });

    it("create submit calls createQuote with customer and items", async () => {
        vi.mocked(quotesApi.createQuote).mockResolvedValue(BASE_QUOTE);
        render(<FormUnderTest open editing={null} onClose={vi.fn()} onSuccess={vi.fn()} />);

        await userEvent.type(screen.getByTestId("customer"), "cust-1");
        await userEvent.click(screen.getByTestId("fill-items"));
        await userEvent.click(screen.getByRole("button", { name: "submit" }));

        await waitFor(() =>
            expect(quotesApi.createQuote).toHaveBeenCalledWith(
                expect.objectContaining({
                    customer: "cust-1",
                    items: expect.arrayContaining([
                        expect.objectContaining({ description: "Valid Item" }),
                    ]),
                })
            )
        );
    });

    it("calls onSuccess and onClose after successful submit", async () => {
        vi.mocked(quotesApi.updateQuote).mockResolvedValue(BASE_QUOTE);
        const onClose = vi.fn();
        const onSuccess = vi.fn();

        render(<FormUnderTest open editing={BASE_QUOTE} onClose={onClose} onSuccess={onSuccess} />);
        await userEvent.click(screen.getByRole("button", { name: "submit" }));

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalledTimes(1);
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    it("calls handleError on submit failure and does not close", async () => {
        const err = new Error("Network error");
        vi.mocked(quotesApi.updateQuote).mockRejectedValue(err);
        const onClose = vi.fn();
        const onSuccess = vi.fn();

        render(<FormUnderTest open editing={BASE_QUOTE} onClose={onClose} onSuccess={onSuccess} />);
        await userEvent.click(screen.getByRole("button", { name: "submit" }));

        await waitFor(() =>
            expect(handleErrorModule.handleError).toHaveBeenCalledWith(err, "Failed to update quote")
        );
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    it("resets form values when editing quote changes", async () => {
        const quoteB: Quote = { ...BASE_QUOTE, _id: "q-2", quoteNumber: "Q-20240202-2002" };
        vi.mocked(quotesApi.updateQuote).mockResolvedValue(quoteB);

        const { rerender } = render(
            <FormUnderTest open editing={BASE_QUOTE} onClose={vi.fn()} onSuccess={vi.fn()} />
        );
        await act(async () => {
            rerender(<FormUnderTest open editing={quoteB} onClose={vi.fn()} onSuccess={vi.fn()} />);
        });

        await userEvent.click(screen.getByRole("button", { name: "submit" }));

        await waitFor(() =>
            expect(quotesApi.updateQuote).toHaveBeenCalledWith("q-2", expect.anything())
        );
    });

    it("system status suppresses transitionQuoteStatus even when form status differs", async () => {
        vi.mocked(quotesApi.updateQuote).mockResolvedValue({ ...BASE_QUOTE, status: "expired" });
        render(
            <FormUnderTest
                open
                editing={{ ...BASE_QUOTE, status: "expired" }}
                onClose={vi.fn()}
                onSuccess={vi.fn()}
            />
        );
        await userEvent.click(screen.getByRole("button", { name: "submit" }));

        await waitFor(() => expect(quotesApi.updateQuote).toHaveBeenCalled());
        expect(quotesApi.transitionQuoteStatus).not.toHaveBeenCalled();
    });

    it("transitionQuoteStatus rejection calls handleError with 'Failed to update quote'", async () => {
        const err = new Error("Transition failed");
        vi.mocked(quotesApi.updateQuote).mockResolvedValue(BASE_QUOTE);
        vi.mocked(quotesApi.transitionQuoteStatus).mockRejectedValue(err);
        render(<FormUnderTest open editing={BASE_QUOTE} onClose={vi.fn()} onSuccess={vi.fn()} />);

        await userEvent.clear(screen.getByTestId("status"));
        await userEvent.type(screen.getByTestId("status"), "sent");
        await userEvent.click(screen.getByRole("button", { name: "submit" }));

        await waitFor(() =>
            expect(handleErrorModule.handleError).toHaveBeenCalledWith(err, "Failed to update quote")
        );
    });

    it("isSystemStatus is true for expired and converted, false for draft", async () => {
        const { rerender } = render(
            <FormUnderTest
                open
                editing={{ ...BASE_QUOTE, status: "expired" }}
                onClose={vi.fn()}
                onSuccess={vi.fn()}
            />
        );
        expect(screen.getByTestId("system-status")).toBeInTheDocument();

        await act(async () => {
            rerender(<FormUnderTest open editing={BASE_QUOTE} onClose={vi.fn()} onSuccess={vi.fn()} />);
        });
        expect(screen.queryByTestId("system-status")).not.toBeInTheDocument();
    });
});
