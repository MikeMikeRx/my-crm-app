import axios, { AxiosError } from "axios";

if (!import.meta.env.VITE_API_URL) {
  throw new Error("VITE_API_URL is not defined in environment variables");
}

export const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

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

export type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

export function getApiError(e: unknown): ApiErrorPayload {
  const err = e as AxiosError<ApiErrorPayload>;
  return err.response?.data ?? { message: err.message || "Request failed" };
}
