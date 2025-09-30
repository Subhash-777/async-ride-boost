import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/enhanced-button';
import { Badge } from '@/components/ui/badge';
import { LocationPicker } from './LocationPicker';
import { rideAPI } from '@/lib/api';
import { Location, RideRequest, RideEstimate, RideBookingResponse } from '@/types/ride';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Zap, 
  Navigation, 
  ArrowUpDown,
  TrendingUp,
  Car,
  Users,
  Crown,
  Route,
  Timer,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  Loader2
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
  const [performanceResults, setPerformanceResults] = useState<RideBookingResponse['performance'] | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const estimateTimeoutRef = useRef<NodeJS.Timeout>();

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
      // Clear previous timeout
      if (estimateTimeoutRef.current) {
        clearTimeout(estimateTimeoutRef.current);
      }
      
      // Debounce the estimate request
      estimateTimeoutRef.current = setTimeout(() => {
        getEstimate();
      }, 500);
    } else {
      setEstimate(null);
      setEstimateError(null);
    }
    
    return () => {
      if (estimateTimeoutRef.current) {
        clearTimeout(estimateTimeoutRef.current);
      }
    };
  }, [pickupLocation, dropoffLocation, rideType]);

  const handlePickupChange = (location: Location) => {
    console.log('Pickup location changed:', location);
    setPickupLocation(location);
    if (onLocationChange) {
      onLocationChange('pickup', location);
    }
    if (onPickupChange) {
      onPickupChange(location);
    }
  };

  const handleDropoffChange = (location: Location) => {
    console.log('Dropoff location changed:', location);
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
    setEstimateError(null);
    
    try {
      const rideRequest: RideRequest = {
        pickup: pickupLocation,
        dropoff: dropoffLocation,
        ride_type: rideType,
      };
      
      console.log('Getting estimate for:', rideRequest);
      const estimateData = await rideAPI.getEstimate(rideRequest);
      console.log('Estimate received:', estimateData);
      setEstimate(estimateData);
    } catch (error: any) {
      console.error('Estimate error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to calculate estimate';
      setEstimateError(errorMessage);
      toast({
        title: "Failed to get estimate",
        description: errorMessage,
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

    if (!estimate) {
      toast({
        title: "No fare estimate",
        description: "Please wait for fare calculation",
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
      
      let response: RideBookingResponse;
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
      } as RideBookingResponse['performance']);

      toast({
        title: "🎉 Ride booked successfully!",
        description: `Your ${rideType} ride has been confirmed. Ride ID: ${response.ride_id}`,
      });

      // Clear locations after successful booking
      setPickupLocation(undefined);
      setDropoffLocation(undefined);
      setEstimate(null);
    } catch (error: any) {
      console.error('Booking error:', error);
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
    if (!pickupLocation || !dropoffLocation) return;
    
    const temp = pickupLocation;
    setPickupLocation(dropoffLocation);
    setDropoffLocation(temp);
    
    if (onLocationChange) {
      onLocationChange('pickup', dropoffLocation);
      onLocationChange('dropoff', temp);
    }
    if (onPickupChange) {
      onPickupChange(dropoffLocation);
    }
    if (onDropoffChange) {
      onDropoffChange(temp);
    }

    toast({
      title: "Locations swapped",
      description: "Pickup and dropoff locations have been swapped",
    });
  };

  const openNavigation = () => {
    if (!pickupLocation) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${pickupLocation.lat},${pickupLocation.lng}&travelmode=driving&dir_action=navigate`;
    window.open(url, '_blank');
  };

  const rideTypes = [
    { 
      id: 'standard', 
      name: 'RideShare Go', 
      icon: <Car className="h-5 w-5" />, 
      multiplier: 1.0,
      description: 'Affordable everyday rides',
      features: ['AC', '4 seats', 'Affordable'],
      eta: '2-5 min',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-600'
    },
    { 
      id: 'premium', 
      name: 'RideShare Premier', 
      icon: <Crown className="h-5 w-5" />, 
      multiplier: 1.6,
      description: 'Premium cars with top drivers',
      features: ['Premium AC', 'Luxury seats', 'Top rated drivers'],
      eta: '3-7 min',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      iconColor: 'text-purple-600'
    },
    { 
      id: 'shared', 
      name: 'RideShare Pool', 
      icon: <Users className="h-5 w-5" />, 
      multiplier: 0.7,
      description: 'Share rides, save money',
      features: ['Shared ride', 'Eco-friendly', 'Budget saver'],
      eta: '5-10 min',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      iconColor: 'text-green-600'
    },
  ];

  const selectedRideType = rideTypes.find(type => type.id === rideType);

  return (
    <Card className="border-card-border shadow-lg">
      <CardHeader className="pb-4 bg-gradient-to-r from-ride-primary/5 to-ride-secondary/5">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-ride-primary/10 rounded-full">
            <MapPin className="h-5 w-5 text-ride-primary" />
          </div>
          <span className="text-xl">Book Your Ride</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">Choose your destination and ride type</p>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Location Inputs with Uber-like Design */}
        <div className="relative">
          {/* Pickup Location */}
          <div className="relative">
            <div className="absolute left-4 top-4 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-md z-10"></div>
            <div className="pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
              <label className="text-xs font-medium text-gray-600 mb-1 block uppercase tracking-wide">
                Pickup Location
              </label>
              <LocationPicker
                value={pickupLocation}
                placeholder="Enter pickup location"
                onLocationChange={handlePickupChange}
                showCurrentLocation={true}
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center my-2 relative">
            <div className="absolute left-4 w-0.5 h-4 bg-gray-300"></div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={swapLocations}
              className="rounded-full p-2 h-10 w-10 bg-white border-2 border-gray-300 hover:border-ride-primary shadow-md z-10"
              disabled={!pickupLocation || !dropoffLocation}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
            <div className="absolute left-4 top-4 w-0.5 h-4 bg-gray-300"></div>
          </div>

          {/* Dropoff Location */}
          <div className="relative">
            <div className="absolute left-4 top-4 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md z-10"></div>
            <div className="pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
              <label className="text-xs font-medium text-gray-600 mb-1 block uppercase tracking-wide">
                Drop-off Location
              </label>
              <LocationPicker
                value={dropoffLocation}
                placeholder="Where to?"
                onLocationChange={handleDropoffChange}
                showCurrentLocation={false}
              />
            </div>
          </div>
        </div>

        {/* Ride Type Selection - Uber Style */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-lg">Choose a ride</h3>
          </div>
          
          <div className="space-y-3">
            {rideTypes.map((type) => {
              const isSelected = rideType === type.id;
              const fareForType = estimate ? estimate.total_fare * type.multiplier : 0;
              
              return (
                <button
                  key={type.id}
                  onClick={() => setRideType(type.id as any)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left hover:shadow-md ${
                    isSelected
                      ? 'border-ride-primary bg-ride-primary/5 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${type.bgColor} ${type.borderColor} border`}>
                        <div className={type.iconColor}>
                          {type.icon}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-base">{type.name}</h4>
                        <p className="text-sm text-gray-600 mb-1">{type.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Timer className="h-3 w-3" />
                          <span>{type.eta}</span>
                          <span>•</span>
                          <span>{type.features.join(' • ')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {isEstimating ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-gray-500">Calculating...</span>
                        </div>
                      ) : estimate ? (
                        <>
                          <div className="flex items-center gap-1">
                            <IndianRupee className="h-4 w-4" />
                            <span className="text-xl font-bold">
                              {Math.round(fareForType)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {estimate.duration} min trip
                          </p>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">Select locations</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Estimate Display - Uber Style */}
        {isEstimating && (
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Calculating your fare</p>
                  <p className="text-sm text-blue-600">Finding the best route...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {estimateError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Cannot calculate fare</p>
                  <p className="text-sm text-red-600">{estimateError}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {estimate && !isEstimating && !estimateError && (
          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-800">Trip Details</h4>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <Route className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-green-800">
                    {estimate.distance} km
                  </p>
                  <p className="text-xs text-green-600 uppercase tracking-wide">Distance</p>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-green-800">
                    {estimate.duration} min
                  </p>
                  <p className="text-xs text-green-600 uppercase tracking-wide">Duration</p>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <IndianRupee className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-green-800">
                    ₹{Math.round(estimate.total_fare * selectedRideType!.multiplier)}
                  </p>
                  <p className="text-xs text-green-600 uppercase tracking-wide">Total Fare</p>
                </div>
              </div>
              
              {estimate.surge_multiplier > 1.0 && (
                <div className="flex items-center gap-2 p-3 bg-orange-100 rounded-lg border border-orange-200">
                  <Zap className="h-4 w-4 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-800">
                      High Demand • {estimate.surge_multiplier}x Surge
                    </p>
                    <p className="text-xs text-orange-600">
                      Prices are higher due to increased demand
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-green-600 mt-4 pt-3 border-t border-green-200">
                <span>Base Fare: ₹{Math.round(estimate.base_fare)}</span>
                {/* ✅ FIXED: Use optional chaining and provide default */}
                <span>Distance Fare: ₹{Math.round(estimate.distance_fare ?? 0)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Testing */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                <label className="text-sm font-medium text-amber-800">
                  Database Performance Demo
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={bookingMethod === 'sequential' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBookingMethod('sequential')}
                  className="text-xs bg-red-100 border-red-200 text-red-700 hover:bg-red-200"
                >
                  Sequential (Slow)
                </Button>
                <Button
                  type="button"
                  variant={bookingMethod === 'parallel' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBookingMethod('parallel')}
                  className="text-xs bg-green-100 border-green-200 text-green-700 hover:bg-green-200"
                >
                  Parallel (Fast)
                </Button>
              </div>
              <p className="text-xs text-amber-700">
                This demo shows how async database operations improve performance
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={bookRide}
            disabled={!pickupLocation || !dropoffLocation || isLoading || isEstimating || !!estimateError}
            className="w-full h-14 bg-gradient-to-r from-ride-primary to-ride-secondary hover:from-ride-primary/90 hover:to-ride-secondary/90 text-lg font-semibold rounded-xl shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Booking your ride...</span>
              </div>
            ) : estimate ? (
              <div className="flex items-center gap-2">
                <span>Confirm {selectedRideType?.name}</span>
                <span>• ₹{Math.round(estimate.total_fare * selectedRideType!.multiplier)}</span>
              </div>
            ) : (
              'Select pickup & dropoff locations'
            )}
          </Button>

          {pickupLocation && (
            <Button
              onClick={openNavigation}
              variant="outline"
              className="w-full gap-2 h-12 rounded-xl"
            >
              <Navigation className="h-4 w-4" />
              Navigate to Pickup Location
            </Button>
          )}
        </div>

        {/* Performance Results */}
        {performanceResults && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Performance Results - {performanceResults.method === 'parallel' ? 'Parallel ⚡' : 'Sequential 🐌'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-blue-600 font-medium">Database Time</p>
                  <p className="text-2xl font-bold text-blue-800">{performanceResults.dbTime}ms</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-blue-600 font-medium">Total Time</p>
                  <p className="text-2xl font-bold text-blue-800">{performanceResults.totalTime}ms</p>
                </div>
              </div>
              <div className="mt-3 p-2 bg-blue-100 rounded-lg">
                <p className="text-xs text-blue-700 text-center">
                  <strong>Method:</strong> {performanceResults.method === 'parallel' ? 'Async/Parallel Database Operations' : 'Sequential/Blocking Database Operations'}
                  {performanceResults.speedImprovement && (
                    <span className="block mt-1 font-medium text-blue-800">
                      {performanceResults.speedImprovement}
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
