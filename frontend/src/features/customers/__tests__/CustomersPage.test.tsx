import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import CustomersPage from "@/features/customers/CustomersPage";

vi.mock("@/api/customers", () => ({
  listCustomers: () =>
    Promise.resolve({
      data: [
        {
          _id: "1",
          name: "ACME",
          email: "a@a.com",
          phone: "",
          company: "",
          address: "",
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 20,
        pages: 1,
      },
    }),
  deleteCustomer: () => Promise.resolve({ message: "Customer deleted" }),
}));

test("renders customers from API", async () => {
  render(
    <MemoryRouter>
      <CustomersPage />
    </MemoryRouter>
  );

  expect(await screen.findByText("ACME")).toBeInTheDocument();
});
