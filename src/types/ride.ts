export interface Location {
  lat: number;
  lng: number;
  address?: string;
  formatted_address?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle_type: string;
  license_plate: string;
  rating: number;
  status: 'online' | 'offline' | 'busy';
  location: Location;
  eta?: number; // Estimated time of arrival in minutes
}

export interface RideRequest {
  pickup: Location;
  dropoff: Location;
  ride_type: 'standard' | 'premium' | 'shared';
}

export interface RideEstimate {
  distance: number;
  duration: number;
  base_fare: number;
  surge_multiplier: number;
  total_fare: number;
  currency: string;
}
