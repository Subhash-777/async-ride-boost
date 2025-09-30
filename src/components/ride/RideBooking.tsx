import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/enhanced-button';
import { Badge } from '@/components/ui/badge';
import { LocationPicker } from './LocationPicker';
import { rideAPI } from '@/lib/api';
import { Location, RideRequest, RideEstimate } from '@/types/ride';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Zap, 
  Navigation, 
  ArrowRight,
  TrendingUp,
  Car,
  Users,
  Crown
} from 'lucide-react';

interface RideBookingProps {
  pickup?: Location;
  dropoff?: Location;
  onLocationChange?: (type: 'pickup' | 'dropoff', location: Location) => void;
  onPickupChange?: (location: Location) => void;
  onDropoffChange?: (location: Location) => void;
}

export const RideBooking: React.FC<RideBookingProps> = ({
  pickup,
  dropoff,
  onLocationChange,
  onPickupChange,
  onDropoffChange,
}) => {
  const [pickupLocation, setPickupLocation] = useState<Location | undefined>(pickup);
  const [dropoffLocation, setDropoffLocation] = useState<Location | undefined>(dropoff);
  const [rideType, setRideType] = useState<'standard' | 'premium' | 'shared'>('standard');
  const [estimate, setEstimate] = useState<RideEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingMethod, setBookingMethod] = useState<'sequential' | 'parallel'>('parallel');
  const [performanceResults, setPerformanceResults] = useState<any>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  
  const { toast } = useToast();

  // Sync with props
  useEffect(() => {
    setPickupLocation(pickup);
  }, [pickup]);

  useEffect(() => {
    setDropoffLocation(dropoff);
  }, [dropoff]);

  // Get estimate when locations are set
  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      getEstimate();
    } else {
      setEstimate(null);
    }
  }, [pickupLocation, dropoffLocation, rideType]);

  const handlePickupChange = (location: Location) => {
    setPickupLocation(location);
    if (onLocationChange) {
      onLocationChange('pickup', location);
    }
    if (onPickupChange) {
      onPickupChange(location);
    }
  };

  const handleDropoffChange = (location: Location) => {
    setDropoffLocation(location);
    if (onLocationChange) {
      onLocationChange('dropoff', location);
    }
    if (onDropoffChange) {
      onDropoffChange(location);
    }
  };

  const getEstimate = async () => {
    if (!pickupLocation || !dropoffLocation) return;
    
    setIsEstimating(true);
    try {
      const rideRequest: RideRequest = {
        pickup: pickupLocation,
        dropoff: dropoffLocation,
        ride_type: rideType,
      };
      const estimateData = await rideAPI.getEstimate(rideRequest);
      setEstimate(estimateData);
    } catch (error: any) {
      console.error('Estimate error:', error);
      toast({
        title: "Failed to get estimate",
        description: "Please check your locations and try again",
        variant: "destructive",
      });
    } finally {
      setIsEstimating(false);
    }
  };

  const bookRide = async () => {
    if (!pickupLocation || !dropoffLocation) {
      toast({
        title: "Missing locations",
        description: "Please select both pickup and dropoff locations",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const rideRequest: RideRequest = {
        pickup: pickupLocation,
        dropoff: dropoffLocation,
        ride_type: rideType,
      };

      const startTime = performance.now();
      
      let response;
      if (bookingMethod === 'sequential') {
        response = await rideAPI.bookRideSequential(rideRequest);
      } else {
        response = await rideAPI.bookRideParallel(rideRequest);
      }
      
      const endTime = performance.now();
      const clientTime = endTime - startTime;
      
      setPerformanceResults({
        ...response.performance,
        clientTime,
        method: bookingMethod,
      });

      toast({
        title: "Ride booked successfully! 🚗",
        description: `Ride ID: ${response.ride_id}`,
      });
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const swapLocations = () => {
    const temp = pickupLocation;
    setPickupLocation(dropoffLocation);
    setDropoffLocation(temp);
    
    if (onLocationChange && dropoffLocation && temp) {
      onLocationChange('pickup', dropoffLocation);
      onLocationChange('dropoff', temp);
    }
    if (onPickupChange && dropoffLocation) {
      onPickupChange(dropoffLocation);
    }
    if (onDropoffChange && temp) {
      onDropoffChange(temp);
    }
  };

  const openNavigation = () => {
    if (!pickupLocation) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${pickupLocation.lat},${pickupLocation.lng}&travelmode=driving&dir_action=navigate`;
    window.open(url, '_blank');
  };

  const rideTypes = [
    { 
      id: 'standard', 
      name: 'Standard', 
      icon: <Car className="h-4 w-4" />, 
      multiplier: 1.0,
      description: 'Affordable rides',
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    },
    { 
      id: 'premium', 
      name: 'Premium', 
      icon: <Crown className="h-4 w-4" />, 
      multiplier: 1.5,
      description: 'Luxury experience',
      color: 'bg-purple-50 border-purple-200 text-purple-700'
    },
    { 
      id: 'shared', 
      name: 'Shared', 
      icon: <Users className="h-4 w-4" />, 
      multiplier: 0.8,
      description: 'Share & save',
      color: 'bg-green-50 border-green-200 text-green-700'
    },
  ];

  return (
    <Card className="border-card-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-ride-primary" />
          Book Your Ride
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Location Inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Pickup Location
            </label>
            <LocationPicker
              value={pickupLocation}
              placeholder="Where would you like to be picked up?"
              onLocationChange={handlePickupChange}
              showCurrentLocation={true}
            />
          </div>

          {/* Swap button */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={swapLocations}
              className="rounded-full p-2 h-8 w-8"
              disabled={!pickupLocation || !dropoffLocation}
            >
              <ArrowRight className="h-4 w-4 rotate-90" />
            </Button>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Drop-off Location
            </label>
            <LocationPicker
              value={dropoffLocation}
              placeholder="Where are you going?"
              onLocationChange={handleDropoffChange}
              showCurrentLocation={false}
            />
          </div>
        </div>

        {/* Ride Type Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Choose Your Ride
          </label>
          <div className="grid grid-cols-1 gap-3">
            {rideTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setRideType(type.id as any)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  rideType === type.id
                    ? 'border-ride-primary bg-ride-primary/5'
                    : 'border-border hover:border-border-hover'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${type.color}`}>
                      {type.icon}
                    </div>
                    <div>
                      <h4 className="font-medium">{type.name}</h4>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                  {estimate && (
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        ${(estimate.total_fare * type.multiplier).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ~{estimate.duration} min
                      </p>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Estimate Display */}
        {isEstimating && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Calculating fare...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {estimate && !isEstimating && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-green-800">
                    {Math.round(estimate.duration)} min
                  </p>
                  <p className="text-xs text-green-600">Duration</p>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-green-800">
                    ${estimate.total_fare.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-600">Total Fare</p>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-green-800">
                    {estimate.surge_multiplier}x
                  </p>
                  <p className="text-xs text-green-600">Surge</p>
                </div>
              </div>
              
              {estimate.surge_multiplier > 1.0 && (
                <div className="mt-3 p-2 bg-orange-100 rounded-lg">
                  <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                    <Zap className="h-3 w-3 mr-1" />
                    High demand - {estimate.surge_multiplier}x surge pricing
                  </Badge>
                </div>
              )}

              <div className="mt-3 text-xs text-green-600">
                Distance: {estimate.distance} km • Base fare: ${estimate.base_fare.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Testing */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-yellow-800">
                Database Access Method (Performance Demo)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={bookingMethod === 'sequential' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBookingMethod('sequential')}
                  className="text-xs"
                >
                  Sequential (Slow)
                </Button>
                <Button
                  type="button"
                  variant={bookingMethod === 'parallel' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBookingMethod('parallel')}
                  className="text-xs"
                >
                  Parallel (Fast)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={bookRide}
            disabled={!pickupLocation || !dropoffLocation || isLoading}
            className="w-full h-12 bg-gradient-to-r from-ride-primary to-ride-secondary hover:from-ride-primary/90 hover:to-ride-secondary/90"
          >
            {isLoading ? 'Booking Ride...' : 'Book Ride'}
          </Button>

          {pickupLocation && (
            <Button
              onClick={openNavigation}
              variant="outline"
              className="w-full gap-2"
            >
              <Navigation className="h-4 w-4" />
              Navigate to Pickup
            </Button>
          )}
        </div>

        {/* Performance Results */}
        {performanceResults && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-blue-800">
                Performance Results - {performanceResults.method === 'parallel' ? 'Parallel' : 'Sequential'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-600 font-medium">Database Time</p>
                  <p className="font-bold text-blue-800">{performanceResults.dbTime}ms</p>
                </div>
                <div>
                  <p className="text-blue-600 font-medium">Total Time</p>
                  <p className="font-bold text-blue-800">{performanceResults.totalTime}ms</p>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Method: {performanceResults.method === 'parallel' ? 'Async/Parallel' : 'Sequential/Blocking'}
                {performanceResults.speedImprovement && (
                  <span className="ml-2 font-medium">
                    ({performanceResults.speedImprovement})
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
