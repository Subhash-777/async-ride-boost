import React, { useState, useEffect } from 'react';
import { RideMap } from '@/components/map/RideMap';
import { RideBooking } from '@/components/ride/RideBooking';
import { Button } from '@/components/ui/enhanced-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authService } from '@/lib/auth';
import { rideAPI } from '@/lib/api';
import { Location, Driver } from '@/types/ride';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User, Wallet, History, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Navigate } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const [pickup, setPickup] = useState<Location | undefined>();
  const [dropoff, setDropoff] = useState<Location | undefined>();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const user = authService.getUser();
  const { toast } = useToast();

  // Load nearby drivers
  useEffect(() => {
    if (pickup) {
      loadNearbyDrivers(pickup.lat, pickup.lng);
    }
  }, [pickup]);

  const loadNearbyDrivers = async (lat: number, lng: number) => {
    setIsLoadingDrivers(true);
    try {
      const nearbyDrivers = await rideAPI.getNearbyDrivers(lat, lng);
      setDrivers(nearbyDrivers);
    } catch (error: any) {
      console.error('Failed to load drivers:', error);
      // Don't show error toast for driver loading as it's not critical
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  const handleLocationChange = (type: 'pickup' | 'dropoff', location: Location) => {
    if (type === 'pickup') {
      setPickup(location);
    } else {
      setDropoff(location);
    }
  };

  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-primary">
                <span className="text-white text-xl">🚗</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">RideShare</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Card className="px-3 py-1">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-ride-primary" />
                  <span className="text-sm font-medium">${user.wallet_balance.toFixed(2)}</span>
                </div>
              </Card>
              
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span>Live Map</span>
                  <div className="flex items-center gap-2">
                    {isLoadingDrivers && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-ride-primary"></div>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {drivers.length} drivers nearby
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <RideMap
                  pickup={pickup}
                  dropoff={dropoff}
                  drivers={drivers}
                  onLocationSelect={(location) => {
                    if (!pickup) {
                      setPickup(location);
                      toast({
                        title: "Pickup location set",
                        description: `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
                      });
                    } else if (!dropoff) {
                      setDropoff(location);
                      toast({
                        title: "Drop-off location set",
                        description: `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
                      });
                    }
                  }}
                  className="h-[500px]"
                />
              </CardContent>
            </Card>
          </div>

          {/* Booking Section */}
          <div className="space-y-6">
            <RideBooking
              pickup={pickup}
              dropoff={dropoff}
              onLocationChange={handleLocationChange}
            />

            {/* Quick Actions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  Trip History
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Profile Settings
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Activity className="h-4 w-4 mr-2" />
                  Performance Stats
                </Button>
              </CardContent>
            </Card>

            {/* Performance Info */}
            <Card className="shadow-card bg-gradient-to-br from-ride-primary/10 to-ride-accent/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-ride-primary" />
                  Database Performance Demo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  This app demonstrates the performance difference between sequential and parallel database operations.
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-ride-danger rounded-full"></div>
                    <span className="text-xs">Sequential: ~300-500ms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-ride-primary rounded-full"></div>
                    <span className="text-xs">Parallel: ~100-200ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};