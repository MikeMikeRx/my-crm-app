import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLogin } from "./useLogin";
import * as handleErrorModule from "@/shared/utils/handleError";

const mockNavigate = vi.hoisted(() => vi.fn());
const mockStoreLogin = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async (importActual) => {
    const mod = await importActual<typeof import("react-router-dom")>();
    return { ...mod, useNavigate: () => mockNavigate };
});

vi.mock("@/features/auth/authStore", () => ({
    useAuthStore: () => ({
        login: mockStoreLogin,
        register: vi.fn(),
        user: null,
        loading: false,
    }),
}));

vi.mock("@/shared/utils/handleError", () => ({
    handleError: vi.fn(),
}));

vi.mock("antd", async () => {
    const actual = await vi.importActual<typeof import("antd")>("antd");
    return { ...actual, message: { success: vi.fn(), error: vi.fn() } };
});

describe("useLogin", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("successful login calls store login with credentials and navigates to /", async () => {
        mockStoreLogin.mockResolvedValue(undefined);
        const { result } = renderHook(() => useLogin());

        await act(async () => {
            await result.current.onSubmit({ email: "alice@example.com", password: "pass123" });
        });

        expect(mockStoreLogin).toHaveBeenCalledWith("alice@example.com", "pass123");
        expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });

    it("login failure calls handleError with 'Login failed'", async () => {
        const err = new Error("Bad credentials");
        mockStoreLogin.mockRejectedValue(err);
        const { result } = renderHook(() => useLogin());

        await act(async () => {
            await result.current.onSubmit({ email: "alice@example.com", password: "pass123" });
        });

        expect(handleErrorModule.handleError).toHaveBeenCalledWith(err, "Login failed");
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
