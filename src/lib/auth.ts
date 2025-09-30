import { User } from '@/types/auth';
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'ride_auth_token';
const USER_KEY = 'ride_user_data';

// ✅ FIX: Helper function to ensure wallet_balance is a number
const normalizeUser = (user: any): User => {
  return {
    ...user,
    wallet_balance: parseFloat(user.wallet_balance) || 0.0
  };
};

export const authService = {
  setAuth: (token: string, user: User) => {
    localStorage.setItem(TOKEN_KEY, token);
    // ✅ FIX: Normalize user data before storing
    const normalizedUser = normalizeUser(user);
    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
  },

  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser: (): User | null => {
    const userData = localStorage.getItem(USER_KEY);
    if (!userData) return null;
    
    try {
      const user = JSON.parse(userData);
      // ✅ FIX: Always normalize user data when retrieving
      return normalizeUser(user);
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    const token = authService.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp ? decoded.exp > currentTime : false;
    } catch {
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getAuthHeader: () => {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
};
