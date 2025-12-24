import { api, setAccessToken } from "./client";

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: { id: string; name: string; email: string; role?: string};
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    role?: string;
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/login", payload);
    if (data.token) setAccessToken(data.token);
    return data;
}

export async function register(payload: RegisterRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/register", payload);
    if (data.token) setAccessToken(data.token);
    return data;
}

export async function getProfile(): Promise<LoginResponse["user"]> {
    const { data } = await api.get<LoginResponse["user"]>("/auth/profile");
    return data;
}