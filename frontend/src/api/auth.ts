import { api, setAccessToken } from "./client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<{ message: string; data: AuthResponse }>("/auth/login", payload);
  if (data.data.token) setAccessToken(data.data.token);
  return data.data;
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const { data } = await api.post<{ message: string; data: AuthResponse }>("/auth/register", payload);
  if (data.data.token) setAccessToken(data.data.token);
  return data.data;
}

export async function getProfile(): Promise<AuthUser> {
  const { data } = await api.get<{ data: AuthUser }>("/auth/profile");
  return data.data;
}


export async function loginDemo(): Promise<AuthResponse> {
  const { data } = await api.post<{ message: string; data: AuthResponse }>("/auth/demo");
  if (data.data.token) setAccessToken(data.data.token);
  return data.data;
}

export function clearAuthToken() {
  setAccessToken(null);
}
