import axios, { AxiosResponse } from 'axios';
import { authService } from './auth';
import { RideRequest, RideEstimate, Driver, RideBookingResponse } from '@/types/ride';
import { SignupRequest, LoginRequest, AuthResponse } from '@/types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth header to all requests
apiClient.interceptors.request.use((config) => {
  const authHeader = authService.getAuthHeader();
  if (authHeader.Authorization) {
    config.headers.Authorization = authHeader.Authorization;
  }
  return config;
});

// Handle responses and errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      authService.logout();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (data: SignupRequest): Promise<AuthResponse> =>
    apiClient.post('/auth/signup', data).then(res => res.data),
  
  login: (data: LoginRequest): Promise<AuthResponse> =>
    apiClient.post('/auth/login', data).then(res => res.data),
  
  logout: (): Promise<{ message: string }> =>
    apiClient.post('/auth/logout').then(res => res.data),
};

export const rideAPI = {
  getEstimate: (data: RideRequest): Promise<RideEstimate> => {
    console.log('Sending estimate request:', data);
    return apiClient.post('/rides/estimate', data).then(res => {
      console.log('Estimate response:', res.data);
      return res.data;
    });
  },
  
  bookRide: (data: RideRequest): Promise<RideBookingResponse> =>
    apiClient.post('/rides/book', data).then(res => res.data),
  
  bookRideSequential: (data: RideRequest): Promise<RideBookingResponse> =>
    apiClient.post('/rides/book-sequential', data).then(res => res.data),
  
  bookRideParallel: (data: RideRequest): Promise<RideBookingResponse> =>
    apiClient.post('/rides/book-parallel', data).then(res => res.data),
  
  getNearbyDrivers: (lat: number, lng: number, radius: number = 5): Promise<Driver[]> =>
    apiClient.get(`/rides/nearby-drivers?lat=${lat}&lng=${lng}&radius=${radius}`).then(res => res.data),
  
  getTripHistory: (): Promise<any> =>
    apiClient.get('/rides/history').then(res => res.data),
  
  cancelRide: (rideId: string): Promise<{ message: string }> =>
    apiClient.delete(`/rides/${rideId}`).then(res => res.data),
};

export const driverAPI = {
  updateLocation: (lat: number, lng: number): Promise<{ message: string }> =>
    apiClient.post('/driver/location', { lat, lng }).then(res => res.data),
  
  updateStatus: (status: 'online' | 'offline' | 'busy'): Promise<{ message: string }> =>
    apiClient.post('/driver/status', { status }).then(res => res.data),
};
