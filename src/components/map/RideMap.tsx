import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Driver, Location } from '@/types/ride';
import { Card } from '@/components/ui/card';

interface RideMapProps {
  center?: Location;
  pickup?: Location;
  dropoff?: Location;
  drivers?: Driver[];
  className?: string;
  onLocationSelect?: (location: Location) => void;
}

export const RideMap: React.FC<RideMapProps> = ({
  center = { lat: 21.84, lng: 82.79 }, // Default to India coordinates
  pickup,
  dropoff,
  drivers = [],
  className = '',
  onLocationSelect,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [center.lng, center.lat],
      zoom: 13,
      attributionControl: false,
    });

    // Add navigation controls
    map.current.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: false,
      }),
      'top-right'
    );

    // Handle click events for location selection
    if (onLocationSelect) {
      map.current.on('click', (e) => {
        onLocationSelect({
          lat: e.lngLat.lat,
          lng: e.lngLat.lng,
        });
      });
    }

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update pickup marker
  useEffect(() => {
    if (!map.current || !mapLoaded || !pickup) return;

    // Remove existing pickup marker
    if (markersRef.current.pickup) {
      markersRef.current.pickup.remove();
    }

    // Create pickup marker
    const pickupElement = document.createElement('div');
    pickupElement.className = 'w-6 h-6 bg-map-pickup rounded-full border-2 border-white shadow-lg';
    pickupElement.innerHTML = '<div class="w-full h-full rounded-full animate-pulse"></div>';

    markersRef.current.pickup = new maplibregl.Marker(pickupElement)
      .setLngLat([pickup.lng, pickup.lat])
      .addTo(map.current);

    // Add popup
    const popup = new maplibregl.Popup({ offset: 25 })
      .setHTML(`<div class="text-sm font-medium">Pickup Location</div>`);
    markersRef.current.pickup.setPopup(popup);
  }, [pickup, mapLoaded]);

  // Update dropoff marker
  useEffect(() => {
    if (!map.current || !mapLoaded || !dropoff) return;

    // Remove existing dropoff marker
    if (markersRef.current.dropoff) {
      markersRef.current.dropoff.remove();
    }

    // Create dropoff marker
    const dropoffElement = document.createElement('div');
    dropoffElement.className = 'w-6 h-6 bg-map-dropoff rounded-full border-2 border-white shadow-lg';

    markersRef.current.dropoff = new maplibregl.Marker(dropoffElement)
      .setLngLat([dropoff.lng, dropoff.lat])
      .addTo(map.current);

    // Add popup
    const popup = new maplibregl.Popup({ offset: 25 })
      .setHTML(`<div class="text-sm font-medium">Drop-off Location</div>`);
    markersRef.current.dropoff.setPopup(popup);
  }, [dropoff, mapLoaded]);

  // Update driver markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing driver markers
    Object.keys(markersRef.current).forEach(key => {
      if (key.startsWith('driver_')) {
        markersRef.current[key].remove();
        delete markersRef.current[key];
      }
    });

    // Add new driver markers
    drivers.forEach(driver => {
      const driverElement = document.createElement('div');
      driverElement.className = `w-8 h-8 bg-map-driver rounded-full border-2 border-white shadow-lg flex items-center justify-center`;
      driverElement.innerHTML = `<div class="text-black text-xs font-bold">🚗</div>`;

      const marker = new maplibregl.Marker(driverElement)
        .setLngLat([driver.location.lng, driver.location.lat])
        .addTo(map.current!);

      // Add popup with driver info
      const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`
          <div class="p-2">
            <div class="font-medium">${driver.name}</div>
            <div class="text-sm text-gray-600">${driver.vehicle_type}</div>
            <div class="text-sm">Rating: ⭐ ${driver.rating.toFixed(1)}</div>
            ${driver.eta ? `<div class="text-sm">ETA: ${driver.eta} min</div>` : ''}
          </div>
        `);
      marker.setPopup(popup);

      markersRef.current[`driver_${driver.id}`] = marker;
    });
  }, [drivers, mapLoaded]);

  // Fit bounds when pickup and dropoff are set
  useEffect(() => {
    if (!map.current || !mapLoaded || !pickup || !dropoff) return;

    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([pickup.lng, pickup.lat]);
    bounds.extend([dropoff.lng, dropoff.lat]);

    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
    });
  }, [pickup, dropoff, mapLoaded]);

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div ref={mapContainer} className="w-full h-full min-h-[400px]" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ride-primary"></div>
        </div>
      )}
    </Card>
  );
};