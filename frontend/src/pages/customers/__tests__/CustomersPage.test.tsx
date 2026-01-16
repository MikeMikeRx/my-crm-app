import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CustomersPage from "@/pages/customers/CustomersPage";

vi.mock("@/api/customers", () => ({
  listCustomers: () =>
    Promise.resolve([
      { _id: "1", name: "ACME", email: "a@a.com", phone: "", company: "", address: "" },
    ]),
  deleteCustomer: () => Promise.resolve(),
}));

test("renders customers from API", async () => {
  render(
    <MemoryRouter>
      <CustomersPage />
    </MemoryRouter>
  );

  expect(await screen.findByText("ACME")).toBeInTheDocument();
});
