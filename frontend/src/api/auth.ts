import { api, setAccessToken } from "./client";

// ============================================================================
// AUTHENTICATION API
// ============================================================================
// Thin client for auth endpoints.
// Contract:
// - login/register return an access token + user
// - token is stored in memory via setAccessToken()
// - getProfile fetches the current user when authenticated

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * POST /auth/login
 * Authenticates user and stores the returned access token in memory.
 */
export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  if (data.token) setAccessToken(data.token);
  return data;
}

/**
 * POST /auth/register
 * Registers a new user and stores the returned access token in memory.
 */
export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  if (data.token) setAccessToken(data.token);
  return data;
}

/**
 * GET /auth/profile
 * Returns the currently authenticated user's profile.
 */
export async function getProfile(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/auth/profile");
  return data;
}

/**
 * Clears in-memory auth token (frontend-only).
 * Call on logout and on auth failures when you want to force re-auth.
 */
export function clearAuthToken() {
  setAccessToken(null);
}
