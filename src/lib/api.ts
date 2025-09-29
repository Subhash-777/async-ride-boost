import axios from 'axios';
import { authService } from './auth';
import { AuthResponse, LoginRequest, SignupRequest } from '@/types/auth';
import { RideRequest, RideEstimate, TripHistory, Driver } from '@/types/ride';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
console.log('API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: LoginRequest): Promise<AuthResponse> =>
    api.post('/auth/login', data).then(res => res.data),
  
  signup: (data: SignupRequest): Promise<AuthResponse> =>
    api.post('/auth/signup', data).then(res => res.data),
  
  logout: (): Promise<void> =>
    api.post('/auth/logout').then(res => res.data),
};

export const rideAPI = {
  getEstimate: (data: RideRequest): Promise<RideEstimate> =>
    api.post('/rides/estimate', data).then(res => res.data),
  
  bookRide: (data: RideRequest): Promise<{ ride_id: string }> =>
    api.post('/rides/book', data).then(res => res.data),
  
  // Sequential (blocking) endpoint - for performance comparison
  bookRideSequential: (data: RideRequest): Promise<{ ride_id: string; performance: any }> =>
    api.post('/rides/book-sequential', data).then(res => res.data),
  
  // Parallel (async) endpoint - for performance comparison  
  bookRideParallel: (data: RideRequest): Promise<{ ride_id: string; performance: any }> =>
    api.post('/rides/book-parallel', data).then(res => res.data),
  
  getTripHistory: (): Promise<TripHistory> =>
    api.get('/rides/history').then(res => res.data),
  
  getNearbyDrivers: (lat: number, lng: number, radius: number = 5): Promise<Driver[]> =>
    api.get(`/drivers/nearby?lat=${lat}&lng=${lng}&radius=${radius}`).then(res => res.data),
  
  cancelRide: (rideId: string): Promise<void> =>
    api.delete(`/rides/${rideId}`).then(res => res.data),
};

export const performanceAPI = {
  runBenchmark: (endpoint: 'sequential' | 'parallel', requests: number = 100): Promise<any> =>
    api.post('/benchmark/run', { endpoint, requests }).then(res => res.data),
  
  getBenchmarkResults: (): Promise<any> =>
    api.get('/benchmark/results').then(res => res.data),
};

export default api;