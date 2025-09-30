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

// ✅ FIX: Helper function to safely format wallet balance
const formatWalletBalance = (balance: any): string => {
  if (balance === null || balance === undefined) {
    return '0.00';
  }
  
  const numBalance = Number(balance);
  if (isNaN(numBalance)) {
    return '0.00';
  }
  
  return numBalance.toFixed(2);
};

export const HomePage: React.FC = () => {
  const [pickup, setPickup] = useState<Location>();
  const [dropoff, setDropoff] = useState<Location>();
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
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-ride-primary">RideShare</h1>
              <Badge variant="secondary" className="bg-green-900/30 text-green-400">
                Async Database Performance Demo
              </Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span>{user.name}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Wallet className="h-4 w-4 text-green-400" />
                {/* ✅ FIX: Use safe formatting function */}
                <span>${formatWalletBalance(user.wallet_balance)}</span>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Map Section */}
          <div className="space-y-4">
            <Card className="border-card-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-400" />
                    Live Map
                  </span>
                  {isLoadingDrivers && (
                    <Badge variant="secondary">Loading...</Badge>
                  )}
                  <Badge variant="outline">
                    {drivers.length} drivers nearby
                  </Badge>
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
          <div className="space-y-4">
            <RideBooking
              pickup={pickup}
              dropoff={dropoff}
              onLocationChange={handleLocationChange}
            />

            {/* Quick Actions */}
            <Card className="border-card-border">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <History className="h-4 w-4" />
                  View Trip History
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Wallet className="h-4 w-4" />
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>

            {/* Performance Info */}
            <Card className="border-yellow-900/30 bg-yellow-950/20">
              <CardHeader>
                <CardTitle className="text-yellow-400">
                  Database Performance Demo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  This app demonstrates the performance difference between sequential and parallel database operations.
                </p>
                
                <div className="flex justify-between items-center text-sm">
                  <Badge variant="destructive">
                    Sequential: ~300-500ms
                  </Badge>
                  <Badge variant="default" className="bg-green-900/30 text-green-400">
                    Parallel: ~100-200ms
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
