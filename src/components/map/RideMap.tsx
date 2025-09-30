import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder';
import { Location, Driver } from '@/types/ride';
import { Button } from '@/components/ui/enhanced-button';
import { MapPin, Navigation, Car } from 'lucide-react';

// Fix default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const dropoffIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface RideMapProps {
  pickup?: Location;
  dropoff?: Location;
  drivers?: Driver[];
  currentLocation?: Location;
  onLocationSelect?: (location: Location) => void;
  onPickupChange?: (location: Location) => void;
  onDropoffChange?: (location: Location) => void;
  className?: string;
}

// Component to handle geolocation
function LocationFinder({ onLocationFound }: { onLocationFound: (location: Location) => void }) {
  const map = useMap();

  useEffect(() => {
    map.locate({ setView: true, maxZoom: 16 });
    
    const onLocationFound = (e: L.LocationEvent) => {
      const location: Location = {
        lat: e.latlng.lat,
        lng: e.latlng.lng
      };
      onLocationFound(location);
    };

    const onLocationError = (e: L.ErrorEvent) => {
      console.error('Location access denied:', e.message);
      // Fallback to a default location (you can customize this)
      const defaultLocation: Location = {
        lat: 28.6139, // Delhi coordinates as fallback
        lng: 77.2090
      };
      map.setView([defaultLocation.lat, defaultLocation.lng], 13);
      onLocationFound(defaultLocation);
    };

    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);

    return () => {
      map.off('locationfound', onLocationFound);
      map.off('locationerror', onLocationError);
    };
  }, [map, onLocationFound]);

  return null;
}

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (location: Location) => void }) {
  useMapEvents({
    click: async (e) => {
      if (onLocationSelect) {
        const location: Location = {
          lat: e.latlng.lat,
          lng: e.latlng.lng
        };
        
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          location.address = data.display_name;
          location.formatted_address = data.display_name;
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
        }
        
        onLocationSelect(location);
      }
    }
  });

  return null;
}

// Geocoding control component
function GeocodingControl({ onLocationSelect }: { onLocationSelect?: (location: Location) => void }) {
  const map = useMap();

  useEffect(() => {
    // Add geocoding control
    const geocoder = (L.Control as any).geocoder({
      defaultMarkGeocode: false,
      placeholder: 'Search for location...',
      errorMessage: 'Location not found'
    })
    .on('markgeocode', async (e: any) => {
      if (onLocationSelect) {
        const location: Location = {
          lat: e.geocode.center.lat,
          lng: e.geocode.center.lng,
          address: e.geocode.name,
          formatted_address: e.geocode.name
        };
        onLocationSelect(location);
        map.setView([location.lat, location.lng], 16);
      }
    })
    .addTo(map);

    return () => {
      map.removeControl(geocoder);
    };
  }, [map, onLocationSelect]);

  return null;
}

export const RideMap: React.FC<RideMapProps> = ({
  pickup,
  dropoff,
  drivers = [],
  currentLocation,
  onLocationSelect,
  onPickupChange,
  onDropoffChange,
  className = ''
}) => {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([28.6139, 77.2090]); // Default to Delhi
  const [mapReady, setMapReady] = useState(false);

  // Handle current location found
  const handleLocationFound = (location: Location) => {
    setUserLocation(location);
    setMapCenter([location.lat, location.lng]);
    if (onPickupChange && !pickup) {
      onPickupChange(location);
    }
  };

  // Get current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          handleLocationFound(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Keep default location
        }
      );
    }
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          // Get address for current location
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            location.address = data.display_name;
            location.formatted_address = data.display_name;
          } catch (error) {
            console.error('Failed to get address:', error);
          }

          setUserLocation(location);
          setMapCenter([location.lat, location.lng]);
          
          if (onPickupChange) {
            onPickupChange(location);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please check your browser settings.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {mapReady && (
          <>
            <LocationFinder onLocationFound={handleLocationFound} />
            <MapClickHandler onLocationSelect={onLocationSelect} />
            <GeocodingControl onLocationSelect={onLocationSelect} />
          </>
        )}

        {/* Current location marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>
              <div className="text-center">
                <MapPin className="h-4 w-4 mx-auto mb-1" />
                <p className="font-semibold">Your Location</p>
                {userLocation.address && (
                  <p className="text-xs text-gray-600 mt-1">
                    {userLocation.address}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Pickup marker */}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="font-semibold">Pickup Location</span>
                </div>
                {pickup.address && (
                  <p className="text-xs text-gray-600">
                    {pickup.address}
                  </p>
                )}
                <p className="text-xs mt-1">
                  {pickup.lat.toFixed(6)}, {pickup.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Dropoff marker */}
        {dropoff && (
          <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon}>
            <Popup>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="font-semibold">Drop-off Location</span>
                </div>
                {dropoff.address && (
                  <p className="text-xs text-gray-600">
                    {dropoff.address}
                  </p>
                )}
                <p className="text-xs mt-1">
                  {dropoff.lat.toFixed(6)}, {dropoff.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Driver markers */}
        {drivers.map((driver) => (
          <Marker
            key={driver.id}
            position={[driver.location.lat, driver.location.lng]}
            icon={driverIcon}
          >
            <Popup>
              <div className="text-center min-w-[150px]">
                <div className="flex items-center justify-center mb-2">
                  <Car className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="font-semibold">{driver.name}</span>
                </div>
                <div className="space-y-1 text-xs">
                  <p><span className="font-medium">Vehicle:</span> {driver.vehicle_type}</p>
                  <p><span className="font-medium">Plate:</span> {driver.license_plate}</p>
                  <p><span className="font-medium">Rating:</span> ⭐ {driver.rating}</p>
                  <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    driver.status === 'online' ? 'bg-green-100 text-green-800' :
                    driver.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {driver.status.toUpperCase()}
                  </div>
                  {driver.eta && (
                    <p className="text-blue-600 font-medium">{driver.eta} min away</p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating action button for current location */}
      <Button
        onClick={getCurrentLocation}
        className="absolute bottom-4 right-4 z-[1000] rounded-full p-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-lg"
        variant="outline"
        size="sm"
      >
        <Navigation className="h-5 w-5" />
      </Button>

      {/* Map instructions */}
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3 max-w-[200px]">
        <p className="text-xs text-gray-600">
          🗺️ Click on the map to set pickup/dropoff locations
        </p>
        <p className="text-xs text-gray-600 mt-1">
          📍 Use the search box to find specific addresses
        </p>
      </div>
    </div>
  );
};
