import { create } from "zustand";
import { devtools } from "zustand/middleware";
import * as authApi from "@/api/auth";
import { setAccessToken } from "@/api/client";
import type { AuthUser, AuthState } from "./auth.types";

export const useAuthStore = create<AuthState>()(
    devtools((set) => ({
        user: null,
        loading: false,
        initialized: false,

        async login(email, password) {
            set({ loading: true });
            try {
                const data = await authApi.login({ email, password });
                setAccessToken(data.token);
                set({ user: data.user as AuthUser });
            } finally {
                set({ loading: false });
            }
        },

        async register(name, email, password, role) {
            set({ loading: true });
            try {
                const data = await authApi.register({ name, email, password, role });
                setAccessToken(data.token);
                set({ user: data.user as AuthUser });
            } finally {
                set({ loading: false });
            }
        },

        async fetchProfile() {
            set({ loading: true });
            try {
                const profile = await authApi.getProfile();
                set({ user: profile, initialized: true });
            } catch {
                const demoMode = import.meta.env.VITE_DEMO_MODE === "true";
                if (demoMode) {
                    try {
                        const data = await authApi.loginDemo();
                        set({ user: data.user as AuthUser, initialized: true });
                    } catch {
                        set({ user: null, initialized: true });
                    }
                } else {
                    set({ user: null, initialized: true });
                }
            } finally {
                set({ loading: false });
            }
        },

        logout() {
            setAccessToken(null);
            set({ user: null });
        },
    }))
);
