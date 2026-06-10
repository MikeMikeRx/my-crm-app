import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAuthStore } from "./authStore";
import * as authApi from "@/api/auth";
import * as clientModule from "@/api/client";

vi.mock("@/api/auth", () => ({
    login: vi.fn(),
    register: vi.fn(),
    getProfile: vi.fn(),
    loginDemo: vi.fn(),
}));

vi.mock("@/api/client", () => ({
    setAccessToken: vi.fn(),
    api: { post: vi.fn(), get: vi.fn() },
}));

const BASE_USER = { id: "u-1", name: "Alice", email: "alice@example.com" };

describe("authStore", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuthStore.setState({ user: null, loading: false, initialized: false });
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("login calls authApi.login with credentials, sets token and user", async () => {
        vi.mocked(authApi.login).mockResolvedValue({ token: "tok-123", user: BASE_USER });

        await useAuthStore.getState().login("alice@example.com", "pass123");

        expect(authApi.login).toHaveBeenCalledWith({ email: "alice@example.com", password: "pass123" });
        expect(clientModule.setAccessToken).toHaveBeenCalledWith("tok-123");
        expect(useAuthStore.getState().user).toEqual(BASE_USER);
    });

    it("register calls authApi.register, sets token and user", async () => {
        vi.mocked(authApi.register).mockResolvedValue({ token: "tok-456", user: BASE_USER });

        await useAuthStore.getState().register("Alice", "alice@example.com", "pass123");

        expect(authApi.register).toHaveBeenCalledWith({
            name: "Alice",
            email: "alice@example.com",
            password: "pass123",
            role: undefined,
        });
        expect(clientModule.setAccessToken).toHaveBeenCalledWith("tok-456");
        expect(useAuthStore.getState().user).toEqual(BASE_USER);
    });

    it("logout sets token to null and clears user", () => {
        useAuthStore.setState({ user: BASE_USER });

        useAuthStore.getState().logout();

        expect(clientModule.setAccessToken).toHaveBeenCalledWith(null);
        expect(useAuthStore.getState().user).toBeNull();
    });

    it("fetchProfile success sets user and initialized", async () => {
        vi.mocked(authApi.getProfile).mockResolvedValue(BASE_USER);

        await useAuthStore.getState().fetchProfile();

        expect(useAuthStore.getState().user).toEqual(BASE_USER);
        expect(useAuthStore.getState().initialized).toBe(true);
    });

    it("fetchProfile failure with VITE_DEMO_MODE=false sets user null and initialized, skips loginDemo", async () => {
        vi.stubEnv("VITE_DEMO_MODE", "false");
        vi.mocked(authApi.getProfile).mockRejectedValue(new Error("Unauthorized"));

        await useAuthStore.getState().fetchProfile();

        expect(useAuthStore.getState().user).toBeNull();
        expect(useAuthStore.getState().initialized).toBe(true);
        expect(authApi.loginDemo).not.toHaveBeenCalled();
    });

    it("fetchProfile failure with VITE_DEMO_MODE=true triggers loginDemo and sets demo user", async () => {
        vi.stubEnv("VITE_DEMO_MODE", "true");
        vi.mocked(authApi.getProfile).mockRejectedValue(new Error("Unauthorized"));
        vi.mocked(authApi.loginDemo).mockResolvedValue({ token: "demo-tok", user: { ...BASE_USER, name: "Demo" } });

        await useAuthStore.getState().fetchProfile();

        expect(authApi.loginDemo).toHaveBeenCalled();
        expect(useAuthStore.getState().user).toMatchObject({ name: "Demo" });
        expect(useAuthStore.getState().initialized).toBe(true);
    });
});
