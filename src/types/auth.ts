export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'rider' | 'driver'; // Add role support
  wallet_balance: number;
  created_at: string;
  // Driver-specific fields (optional)
  license_number?: string;
  vehicle_type?: string;
  license_plate?: string;
  rating?: number;
  status?: 'online' | 'offline' | 'busy';
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
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
  role: 'rider' | 'driver';
  // Driver-specific fields (optional)
  license_number?: string;
  vehicle_type?: string;
  license_plate?: string;
}
