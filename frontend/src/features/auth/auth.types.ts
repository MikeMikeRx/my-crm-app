export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

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

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  fetchProfile: () => Promise<void>;
  logout: () => void;
}

export type FormValues = {
  name?: string;
  email: string;
  password: string;
  isAdmin?: boolean;
};
