import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { z } from "zod";
import { useAuthStore } from "./authStore";
import { handleError } from "@/shared/utils/handleError";
import type { FormValues } from "./auth.types";

export const loginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    isAdmin: z.boolean().optional(),
});

export function useLogin() {
    const [mode, setMode] = useState<"login" | "register">("login");
    const isRegisterMode = mode === "register";

    const navigate = useNavigate();
    const { login, register, user, loading } = useAuthStore();

    useEffect(() => {
        if (user) navigate("/", { replace: true });
    }, [user, navigate]);

    const onSubmit = async (values: FormValues) => {
        try {
            if (isRegisterMode) {
                if (!values.name) {
                    message.error("Name is required");
                    return;
                }
                const role = values.isAdmin ? "admin" : undefined;
                await register(values.name, values.email, values.password, role);
                message.success("Account created successfully!");
                navigate("/", { replace: true });
            } else {
                await login(values.email, values.password);
                message.success("Login successful");
                navigate("/", { replace: true });
            }
        } catch (e) {
            handleError(e, isRegisterMode ? "Registration failed" : "Login failed");
        }
    };

    const toggleMode = () => setMode(prev => prev === "login" ? "register" : "login");

    return { isRegisterMode, loading, onSubmit, toggleMode };
}
