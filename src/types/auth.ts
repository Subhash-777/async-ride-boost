export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  wallet_balance: number;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
}