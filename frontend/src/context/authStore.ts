import { create } from "zustand";
import { devtools } from "zustand/middleware";
import * as authApi from "@/api/auth";
import { setAccessToken } from "@/api/client";

type User ={
    id: string;
    name: string;
    email: string;
    role?: string;
} | null;

interface AuthState {
    user: User;
    loading: boolean;
    initialized: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    fetchProfile: () => Promise<void>;
    logout: () => void;
}

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
                set({ user: data.user });
            } finally {
                set({ loading: false });
            }
        },

        async register(name, email, password) {
            set({ loading: true });
            try {
                const data = await authApi.register({ name, email, password });
                setAccessToken(data.token);
                set({ user: data.user });
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
                set({ user: null, initialized: true});
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