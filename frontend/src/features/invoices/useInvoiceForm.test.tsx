import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Controller } from "react-hook-form";
import { message } from "antd";
import { useInvoiceForm } from "./useInvoiceForm";
import * as invoicesApi from "@/api/invoices";
import * as quotesApi from "@/api/quotes";
import * as handleErrorModule from "@/shared/utils/handleError";
import type { Invoice } from "@/features/invoices/invoice.types";
import type { Quote } from "@/features/quotes/quote.types";

vi.mock("@/api/invoices", () => ({
    createInvoice: vi.fn(),
    updateInvoice: vi.fn(),
    transitionInvoiceStatus: vi.fn(),
}));

vi.mock("@/api/quotes", () => ({
    listQuotes: vi.fn(),
    getQuote: vi.fn(),
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

const BASE_INVOICE: Invoice = {
    _id: "inv-1",
    customer: "cust-1",
    invoiceNumber: "INV-20240101-1234",
    issueDate: "2024-01-01",
    dueDate: "2024-01-15",
    items: BASE_ITEMS,
    status: "draft",
    notes: "",
    totals: { subtotal: 100, tax: 0, total: 100 },
};

const BASE_QUOTE: Quote = {
    _id: "quote-1",
    user: "user-1",
    customer: { _id: "cust-2", user: "user-1", name: "Beta Co", createdAt: "", updatedAt: "" },
    quoteNumber: "QUO-20240101-5678",
    issueDate: "2024-01-01",
    items: [{ description: "Service", quantity: 2, unitPrice: 200, taxRate: 5 }],
    total: 420,
    status: "draft",
};

type FormProps = { editing: Invoice | null; onClose: () => void; onSuccess: () => void };

function FormUnderTest({ editing, onClose, onSuccess }: FormProps) {
    const { control, onSubmit, handleMarkAsSent, handleQuoteSelect, canMarkAsSent, transitioning, lineItems } =
        useInvoiceForm({ editing, onClose, onSuccess });
    return (
        <form onSubmit={onSubmit}>
            <Controller
                name="customer"
                control={control}
                render={({ field }) => <input data-testid="customer" {...field} />}
            />
            <button
                type="button"
                data-testid="add-item"
                onClick={() => lineItems.append({ description: "Item", quantity: 1, unitPrice: 50, taxRate: 0 })}
            >
                add item
            </button>
            <button
                type="button"
                data-testid="select-quote"
                onClick={() => handleQuoteSelect("quote-1")}
            >
                select quote
            </button>
            <button type="submit">submit</button>
            {canMarkAsSent && (
                <button
                    type="button"
                    data-testid="mark-sent"
                    onClick={handleMarkAsSent}
                    disabled={transitioning}
                >
                    mark as sent
                </button>
            )}
        </form>
    );
}

describe("useInvoiceForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(quotesApi.listQuotes).mockResolvedValue({ data: [], pagination: EMPTY_PAGINATION });
    });

    it("edit submit calls updateInvoice with id and only editable fields", async () => {
        vi.mocked(invoicesApi.updateInvoice).mockResolvedValue(BASE_INVOICE);
        render(<FormUnderTest editing={BASE_INVOICE} onClose={vi.fn()} onSuccess={vi.fn()} />);
        await userEvent.click(screen.getByRole("button", { name: "submit" }));

        await waitFor(() => expect(invoicesApi.updateInvoice).toHaveBeenCalledWith("inv-1", expect.anything()));
        const [, payload] = vi.mocked(invoicesApi.updateInvoice).mock.calls[0];
        expect(payload).toMatchObject({ items: BASE_ITEMS, dueDate: expect.any(String) });
        expect(payload).not.toHaveProperty("customer");
        expect(payload).not.toHaveProperty("invoiceNumber");
    });

    it("create submit calls createInvoice with ISO-formatted dates", async () => {
        vi.mocked(invoicesApi.createInvoice).mockResolvedValue(BASE_INVOICE);
        render(<FormUnderTest editing={null} onClose={vi.fn()} onSuccess={vi.fn()} />);

        await userEvent.type(screen.getByTestId("customer"), "cust-1");
        await userEvent.click(screen.getByTestId("add-item"));
        await userEvent.click(screen.getByRole("button", { name: "submit" }));

        await waitFor(() =>
            expect(invoicesApi.createInvoice).toHaveBeenCalledWith(
                expect.objectContaining({
                    customer: "cust-1",
                    issueDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
                    dueDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
                })
            )
        );
    });

    it("calls onSuccess and onClose after successful submit", async () => {
        vi.mocked(invoicesApi.updateInvoice).mockResolvedValue(BASE_INVOICE);
        const onClose = vi.fn();
        const onSuccess = vi.fn();

        render(<FormUnderTest editing={BASE_INVOICE} onClose={onClose} onSuccess={onSuccess} />);
        await userEvent.click(screen.getByRole("button", { name: "submit" }));

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalledTimes(1);
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    it("calls handleError on submit failure and does not close", async () => {
        const err = new Error("Network error");
        vi.mocked(invoicesApi.updateInvoice).mockRejectedValue(err);
        const onClose = vi.fn();
        const onSuccess = vi.fn();

        render(<FormUnderTest editing={BASE_INVOICE} onClose={onClose} onSuccess={onSuccess} />);
        await userEvent.click(screen.getByRole("button", { name: "submit" }));

        await waitFor(() =>
            expect(handleErrorModule.handleError).toHaveBeenCalledWith(err, "Failed to update invoice")
        );
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    it("canMarkAsSent is true only for draft invoices", async () => {
        const { rerender } = render(
            <FormUnderTest editing={BASE_INVOICE} onClose={vi.fn()} onSuccess={vi.fn()} />
        );
        expect(screen.getByTestId("mark-sent")).toBeInTheDocument();

        await act(async () => {
            rerender(
                <FormUnderTest
                    editing={{ ...BASE_INVOICE, status: "sent" }}
                    onClose={vi.fn()}
                    onSuccess={vi.fn()}
                />
            );
        });
        expect(screen.queryByTestId("mark-sent")).not.toBeInTheDocument();
    });

    it("handleMarkAsSent calls transitionInvoiceStatus then closes", async () => {
        vi.mocked(invoicesApi.transitionInvoiceStatus).mockResolvedValue({ ...BASE_INVOICE, status: "sent" });
        const onClose = vi.fn();
        const onSuccess = vi.fn();

        render(<FormUnderTest editing={BASE_INVOICE} onClose={onClose} onSuccess={onSuccess} />);
        await userEvent.click(screen.getByTestId("mark-sent"));

        await waitFor(() => {
            expect(invoicesApi.transitionInvoiceStatus).toHaveBeenCalledWith("inv-1", "sent");
            expect(onSuccess).toHaveBeenCalledTimes(1);
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    it("handleMarkAsSent calls handleError on failure", async () => {
        const err = new Error("Transition failed");
        vi.mocked(invoicesApi.transitionInvoiceStatus).mockRejectedValue(err);

        render(<FormUnderTest editing={BASE_INVOICE} onClose={vi.fn()} onSuccess={vi.fn()} />);
        await userEvent.click(screen.getByTestId("mark-sent"));

        await waitFor(() =>
            expect(handleErrorModule.handleError).toHaveBeenCalledWith(err, "Failed to update invoice status")
        );
    });

    it("resets form values when editing invoice changes", async () => {
        const invoiceB: Invoice = { ...BASE_INVOICE, _id: "inv-2", invoiceNumber: "INV-20240202-ABCD" };
        vi.mocked(invoicesApi.updateInvoice).mockResolvedValue(invoiceB);

        const { rerender } = render(
            <FormUnderTest editing={BASE_INVOICE} onClose={vi.fn()} onSuccess={vi.fn()} />
        );
        rerender(<FormUnderTest editing={invoiceB} onClose={vi.fn()} onSuccess={vi.fn()} />);

        await userEvent.click(screen.getByRole("button", { name: "submit" }));

        await waitFor(() =>
            expect(invoicesApi.updateInvoice).toHaveBeenCalledWith("inv-2", expect.anything())
        );
    });

    it("handleQuoteSelect calls message.error and skips getQuote when quote id is not in loaded list", async () => {
        // beforeEach mocks listQuotes to return empty data, so no quotes are loaded
        render(<FormUnderTest editing={null} onClose={vi.fn()} onSuccess={vi.fn()} />);
        await waitFor(() => expect(quotesApi.listQuotes).toHaveBeenCalled());

        await userEvent.click(screen.getByTestId("select-quote"));

        await waitFor(() => expect(vi.mocked(message.error)).toHaveBeenCalledWith("Quote not found"));
        expect(quotesApi.getQuote).not.toHaveBeenCalled();
    });

    it("getQuote rejection calls handleError with 'Failed to load quote'", async () => {
        const err = new Error("getQuote failed");
        vi.mocked(quotesApi.listQuotes).mockResolvedValue({
            data: [BASE_QUOTE],
            pagination: { ...EMPTY_PAGINATION, total: 1 },
        });
        vi.mocked(quotesApi.getQuote).mockRejectedValue(err);

        render(<FormUnderTest editing={null} onClose={vi.fn()} onSuccess={vi.fn()} />);
        await waitFor(() => expect(quotesApi.listQuotes).toHaveBeenCalled());

        await userEvent.click(screen.getByTestId("select-quote"));

        await waitFor(() =>
            expect(handleErrorModule.handleError).toHaveBeenCalledWith(err, "Failed to load quote")
        );
    });

    it("handleQuoteSelect calls getQuote and resets the form with quote data", async () => {
        vi.mocked(quotesApi.listQuotes).mockResolvedValue({
            data: [BASE_QUOTE],
            pagination: { ...EMPTY_PAGINATION, total: 1 },
        });
        vi.mocked(quotesApi.getQuote).mockResolvedValue(BASE_QUOTE);

        render(<FormUnderTest editing={null} onClose={vi.fn()} onSuccess={vi.fn()} />);

        await waitFor(() => expect(quotesApi.listQuotes).toHaveBeenCalled());

        await userEvent.click(screen.getByTestId("select-quote"));

        await waitFor(() => expect(quotesApi.getQuote).toHaveBeenCalledWith("quote-1"));
        expect(screen.getByTestId("customer")).toHaveValue("cust-2");
    });
});
