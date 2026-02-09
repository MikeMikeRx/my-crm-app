import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "@/pages/login/LoginPage";

// Mock store to prevent real API calls
vi.mock("@/context/authStore", () => ({
  useAuthStore: () => ({
    login: vi.fn(),
    register: vi.fn(),
    user: null,
    loading: false,
  }),
}));

test("shows validation error on invalid email", async () => {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );

  const email = document.querySelector('input[name="email"]') as HTMLInputElement;
  const password = document.querySelector('input[name="password"]') as HTMLInputElement;

  await userEvent.type(email, "bad-email");
  await userEvent.type(password, "password123");
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

  expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
});
