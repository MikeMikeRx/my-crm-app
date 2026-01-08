import axios, { AxiosError } from "axios";

// ============================================================================
// API CLIENT CONFIGURATION
// ============================================================================

if (!import.meta.env.VITE_API_URL) {
  throw new Error("VITE_API_URL is not defined in environment variables");
}

export const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================
// JWT tokens are stored in memory (not localStorage) for security
// Tokens are lost on page refresh and restored via /auth/profile endpoint

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

export type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

export function getApiError(e: unknown): ApiErrorPayload {
  const err = e as AxiosError<ApiErrorPayload>;
  return err.response?.data ?? { message: err.message || "Request failed" };
}
