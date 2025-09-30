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
  distance?: number; // Distance from user in km
}

export interface RideRequest {
  pickup: Location;
  dropoff: Location;
  ride_type: 'standard' | 'premium' | 'shared';
}

// ✅ FIXED: Add missing properties that backend returns
export interface RideEstimate {
  distance: number;
  duration: number;
  base_fare: number;
  distance_fare?: number; // ✅ Add this property
  surge_multiplier: number;
  total_fare: number;
  currency: string;
  pickup_address?: string; // ✅ Add this property  
  dropoff_address?: string; // ✅ Add this property
}

export interface Ride {
  id: string;
  user_id: string;
  driver_id?: string;
  pickup: Location;
  dropoff: Location;
  ride_type: 'standard' | 'premium' | 'shared';
  status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  fare?: number;
  surge_multiplier?: number;
  distance_km?: number;
  duration_minutes?: number;
  rating?: number;
  created_at: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
}

export interface RideBookingResponse {
  ride_id: string;
  status: string;
  message?: string;
  performance?: {
    method: 'sequential' | 'parallel';
    totalTime: number;
    dbTime: number;
    operations: number;
    avgTimePerOperation?: number;
    speedImprovement?: string;
    clientTime?: number;
  };
}
