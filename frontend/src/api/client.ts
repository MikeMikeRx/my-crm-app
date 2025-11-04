import axios, { AxiosError } from "axios";

export const API_URL = import.meta.env.VITE_API_URL as string;

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
})

// Token management ----------------------------------------------------------------
let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
    accessToken = token;
}

api.interceptors.request.use((config) => {
    if (accessToken) {
        config.headers.set('Authorization', `Bearer ${accessToken}`);
    }
    return config
})
// ----------------------------------------------------------------------------------

// Error helper
export type ApiErrorPayload = { message?: string; errors?: Record<string, string[]>; };
export function getApiError(e: unknown): ApiErrorPayload {
    const err = e as AxiosError<ApiErrorPayload>;
    return err.response?.data ?? { message: (err.message || "Request failed") };
}