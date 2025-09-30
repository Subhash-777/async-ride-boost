import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/enhanced-button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Search, Navigation, Clock } from 'lucide-react';
import { Location } from '@/types/ride';

interface LocationPickerProps {
  value?: Location;
  placeholder?: string;
  onLocationChange?: (location: Location) => void;
  onAddressChange?: (address: string) => void;
  showCurrentLocation?: boolean;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
  type: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  placeholder = "Enter location",
  onLocationChange,
  onAddressChange,
  showCurrentLocation = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<Location[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent).slice(0, 3)); // Keep only 3 recent
    }
  }, []);

  // Update search query when value changes
  useEffect(() => {
    if (value?.address) {
      setSearchQuery(value.address);
    }
  }, [value]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length > 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (result: SearchResult) => {
    const location: Location = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name,
      formatted_address: result.display_name
    };

    setSearchQuery(result.display_name);
    setShowResults(false);
    
    // Save to recent searches
    const newRecentSearches = [location, ...recentSearches.filter(l => l.address !== location.address)].slice(0, 3);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));

    if (onLocationChange) {
      onLocationChange(location);
    }
    if (onAddressChange) {
      onAddressChange(result.display_name);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            location.address = data.display_name;
            location.formatted_address = data.display_name;
            setSearchQuery(data.display_name);
          } catch (error) {
            console.error('Reverse geocoding failed:', error);
            location.address = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
            location.formatted_address = location.address;
            setSearchQuery(location.address);
          }

          if (onLocationChange) {
            onLocationChange(location);
          }
          if (onAddressChange) {
            onAddressChange(location.address || '');
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location. Please check your browser settings.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (onAddressChange) {
              onAddressChange(e.target.value);
            }
          }}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowResults(true);
            }
          }}
          className="pl-10 pr-12"
        />
        {showCurrentLocation && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={getCurrentLocation}
            className="absolute right-0 top-0 h-full px-3"
            title="Use current location"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results */}
      {showResults && (searchResults.length > 0 || recentSearches.length > 0) && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 border-card-border shadow-lg max-h-80 overflow-y-auto">
          <CardContent className="p-0">
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Search Results</span>
                </div>
                {searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    onClick={() => selectLocation(result)}
                    className="w-full text-left px-3 py-3 hover:bg-muted/50 border-b border-border last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {result.display_name.split(',')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {result.display_name}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && searchQuery.length <= 2 && (
              <div>
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Recent Searches</span>
                </div>
                {recentSearches.map((location, index) => (
                  <button
                    key={index}
                    onClick={() => selectLocation({
                      display_name: location.address || '',
                      lat: location.lat.toString(),
                      lon: location.lng.toString(),
                      place_id: `recent_${index}`,
                      type: 'recent'
                    })}
                    className="w-full text-left px-3 py-3 hover:bg-muted/50 border-b border-border last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {location.address?.split(',')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {location.address}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading indicator */}
      {isSearching && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <Card className="border-card-border shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-ride-primary"></div>
                Searching...
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
