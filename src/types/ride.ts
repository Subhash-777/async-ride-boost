export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Driver {
  id: string;
  name: string;
  vehicle_type: string;
  license_plate: string;
  rating: number;
  location: Location;
  status: 'online' | 'offline' | 'busy';
  eta?: number;
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

export interface Ride {
  id: string;
  user_id: string;
  driver_id?: string;
  pickup_location: Location;
  dropoff_location: Location;
  ride_type: string;
  status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  fare: number;
  surge_multiplier: number;
  created_at: string;
  completed_at?: string;
}

export interface TripHistory {
  rides: Ride[];
  total_trips: number;
  total_spent: number;
  average_rating: number;
}