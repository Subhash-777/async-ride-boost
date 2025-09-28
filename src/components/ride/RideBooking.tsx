import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/enhanced-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { rideAPI } from '@/lib/api';
import { Location, RideRequest, RideEstimate } from '@/types/ride';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Clock, DollarSign, Zap, Navigation } from 'lucide-react';

interface RideBookingProps {
  pickup?: Location;
  dropoff?: Location;
  onLocationChange?: (type: 'pickup' | 'dropoff', location: Location) => void;
}

export const RideBooking: React.FC<RideBookingProps> = ({
  pickup,
  dropoff,
  onLocationChange,
}) => {
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [rideType, setRideType] = useState<'standard' | 'premium' | 'shared'>('standard');
  const [estimate, setEstimate] = useState<RideEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingMethod, setBookingMethod] = useState<'sequential' | 'parallel'>('parallel');
  const [performanceResults, setPerformanceResults] = useState<any>(null);
  const { toast } = useToast();

  // Get estimate when locations are set
  useEffect(() => {
    if (pickup && dropoff) {
      getEstimate();
    }
  }, [pickup, dropoff, rideType]);

  const getEstimate = async () => {
    if (!pickup || !dropoff) return;
    
    setIsLoading(true);
    try {
      const rideRequest: RideRequest = {
        pickup,
        dropoff,
        ride_type: rideType,
      };
      const estimateData = await rideAPI.getEstimate(rideRequest);
      setEstimate(estimateData);
    } catch (error: any) {
      toast({
        title: "Failed to get estimate",
        description: error.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const bookRide = async () => {
    if (!pickup || !dropoff) {
      toast({
        title: "Missing locations",
        description: "Please select pickup and dropoff locations",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const rideRequest: RideRequest = {
        pickup,
        dropoff,
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
        title: "Ride booked successfully!",
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

  const openNavigation = () => {
    if (!pickup) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${pickup.lat},${pickup.lng}&travelmode=driving&dir_action=navigate`;
    window.open(url, '_blank');
  };

  const rideTypes = [
    { id: 'standard', name: 'Standard', icon: '🚗', multiplier: 1.0 },
    { id: 'premium', name: 'Premium', icon: '🚙', multiplier: 1.5 },
    { id: 'shared', name: 'Shared', icon: '🚐', multiplier: 0.8 },
  ];

  return (
    <div className="space-y-4">
      <Card className="shadow-card bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-ride-primary" />
            Book Your Ride
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Inputs */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="pickup">Pickup Location</Label>
              <Input
                id="pickup"
                placeholder="Enter pickup address"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className="bg-input border-input-border focus:border-ride-primary"
              />
            </div>
            <div>
              <Label htmlFor="dropoff">Drop-off Location</Label>
              <Input
                id="dropoff"
                placeholder="Enter destination address"
                value={dropoffAddress}
                onChange={(e) => setDropoffAddress(e.target.value)}
                className="bg-input border-input-border focus:border-ride-primary"
              />
            </div>
          </div>

          {/* Ride Type Selection */}
          <div>
            <Label>Ride Type</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {rideTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={rideType === type.id ? 'ride' : 'ride-outline'}
                  size="sm"
                  onClick={() => setRideType(type.id as any)}
                  className="flex flex-col items-center p-3 h-auto"
                >
                  <span className="text-lg mb-1">{type.icon}</span>
                  <span className="text-xs">{type.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Estimate Display */}
          {estimate && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-medium">{Math.round(estimate.duration)} min</div>
                    <div className="text-xs text-muted-foreground">Duration</div>
                  </div>
                  <div>
                    <DollarSign className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-medium">${estimate.total_fare.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">Total Fare</div>
                  </div>
                  <div>
                    <Zap className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-medium">{estimate.surge_multiplier}x</div>
                    <div className="text-xs text-muted-foreground">Surge</div>
                  </div>
                </div>
                {estimate.surge_multiplier > 1.0 && (
                  <Badge variant="destructive" className="w-full mt-2 justify-center">
                    High demand - {estimate.surge_multiplier}x surge pricing
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}

          {/* Performance Testing */}
          <div className="space-y-2">
            <Label>Database Access Method (for performance testing)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={bookingMethod === 'sequential' ? 'destructive' : 'outline'}
                onClick={() => setBookingMethod('sequential')}
                size="sm"
              >
                Sequential (Slow)
              </Button>
              <Button
                variant={bookingMethod === 'parallel' ? 'ride' : 'outline'}
                onClick={() => setBookingMethod('parallel')}
                size="sm"
              >
                Parallel (Fast)
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="ride"
              onClick={bookRide}
              disabled={!pickup || !dropoff || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Booking...' : 'Book Ride'}
            </Button>
            <Button
              variant="ride-secondary"
              onClick={openNavigation}
              disabled={!pickup}
              size="icon"
            >
              <Navigation className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Results */}
      {performanceResults && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm">Performance Results - {performanceResults.method}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Database Time</div>
                <div className="text-muted-foreground">{performanceResults.dbTime}ms</div>
              </div>
              <div>
                <div className="font-medium">Total Time</div>
                <div className="text-muted-foreground">{performanceResults.totalTime}ms</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Method: {performanceResults.method === 'parallel' ? 'Async/Parallel' : 'Sequential/Blocking'}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};