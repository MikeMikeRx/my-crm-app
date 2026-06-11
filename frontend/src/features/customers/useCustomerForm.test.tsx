import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Controller } from "react-hook-form";

import { useCustomerForm } from "./useCustomerForm";
import * as customersApi from "@/api/customers";
import * as handleErrorModule from "@/shared/utils/handleError";
import type { Customer } from "@/features/customers/customer.types";

vi.mock("@/api/customers", () => ({
    createCustomer: vi.fn(),
    updateCustomer: vi.fn(),
}));

vi.mock("@/shared/utils/handleError", () => ({
    handleError: vi.fn(),
}));

vi.mock("antd", async () => {
    const actual = await vi.importActual<typeof import("antd")>("antd");
    return { ...actual, message: { success: vi.fn(), error: vi.fn() } };
});

// Minimal form component — only renders the name field so we can drive submit
type FormProps = { editing: Customer | null; onClose: () => void; onSuccess: () => void };
function FormUnderTest({ editing, onClose, onSuccess }: FormProps) {
    const { control, onSubmit } = useCustomerForm({ editing, onClose, onSuccess });
    return (
        <form onSubmit={onSubmit}>
            <Controller
                name="name"
                control={control}
                render={({ field }) => <input data-testid="name" {...field} />}
            />
            <button type="submit">submit</button>
        </form>
    );
}

const BASE_CUSTOMER: Customer = {
    _id: "cust-1",
    user: "user-1",
    name: "Acme Corp",
    email: "acme@example.com",
    phone: "555-1234",
    company: "Acme",
    address: "1 Main St",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("useCustomerForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("create submit calls createCustomer with expected payload", async () => {
        vi.mocked(customersApi.createCustomer).mockResolvedValue(BASE_CUSTOMER);

        render(<FormUnderTest editing={null} onClose={vi.fn()} onSuccess={vi.fn()} />);
        await userEvent.type(screen.getByTestId("name"), "Acme Corp");
        await userEvent.click(screen.getByRole("button", { name: "submit" }));

        await waitFor(() =>
            expect(customersApi.createCustomer).toHaveBeenCalledWith(
                expect.objectContaining({ name: "Acme Corp" })
            )
        );
    });

    it("edit submit calls updateCustomer with id and payload", async () => {
        vi.mocked(customersApi.updateCustomer).mockResolvedValue(BASE_CUSTOMER);

        render(<FormUnderTest editing={BASE_CUSTOMER} onClose={vi.fn()} onSuccess={vi.fn()} />);
        await userEvent.click(screen.getByRole("button", { name: "submit" }));

        await waitFor(() =>
            expect(customersApi.updateCustomer).toHaveBeenCalledWith(
                "cust-1",
                expect.objectContaining({ name: "Acme Corp" })
            )
        );
    });

    it("calls onSuccess and onClose after successful submit", async () => {
        vi.mocked(customersApi.updateCustomer).mockResolvedValue(BASE_CUSTOMER);
        const onClose = vi.fn();
        const onSuccess = vi.fn();

        render(<FormUnderTest editing={BASE_CUSTOMER} onClose={onClose} onSuccess={onSuccess} />);
        await userEvent.click(screen.getByRole("button", { name: "submit" }));

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalledTimes(1);
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    it("handles API failure via handleError and does not call onSuccess/onClose", async () => {
        const apiError = new Error("Network error");
        vi.mocked(customersApi.updateCustomer).mockRejectedValue(apiError);
        const onClose = vi.fn();
        const onSuccess = vi.fn();

        render(<FormUnderTest editing={BASE_CUSTOMER} onClose={onClose} onSuccess={onSuccess} />);
        await userEvent.click(screen.getByRole("button", { name: "submit" }));

        await waitFor(() =>
            expect(handleErrorModule.handleError).toHaveBeenCalledWith(
                apiError,
                "Failed to update customer"
            )
        );
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    it("createCustomer rejection calls handleError with 'Failed to create customer'", async () => {
        const err = new Error("Create failed");
        vi.mocked(customersApi.createCustomer).mockRejectedValue(err);

        render(<FormUnderTest editing={null} onClose={vi.fn()} onSuccess={vi.fn()} />);
        await userEvent.type(screen.getByTestId("name"), "Acme Corp");
        await userEvent.click(screen.getByRole("button", { name: "submit" }));

        await waitFor(() =>
            expect(handleErrorModule.handleError).toHaveBeenCalledWith(err, "Failed to create customer")
        );
    });

    it("resets form values when editing customer changes", async () => {
        const customerB: Customer = { ...BASE_CUSTOMER, _id: "cust-2", name: "Beta Inc" };

        const { rerender } = render(
            <FormUnderTest editing={BASE_CUSTOMER} onClose={vi.fn()} onSuccess={vi.fn()} />
        );
        expect(screen.getByTestId("name")).toHaveValue("Acme Corp");

        rerender(<FormUnderTest editing={customerB} onClose={vi.fn()} onSuccess={vi.fn()} />);
        await waitFor(() => expect(screen.getByTestId("name")).toHaveValue("Beta Inc"));
    });
});
