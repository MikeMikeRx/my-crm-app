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
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  if (data.token) setAccessToken(data.token);
  return data;
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  if (data.token) setAccessToken(data.token);
  return data;
}

export async function getProfile(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/auth/profile");
  return data;
}


export function clearAuthToken() {
  setAccessToken(null);
}
