import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/enhanced-button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Search, Navigation, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Location } from '@/types/ride';

interface LocationPickerProps {
  value?: Location;
  placeholder?: string;
  onLocationChange?: (location: Location) => void;
  onAddressChange?: (address: string) => void;
  showCurrentLocation?: boolean;
  disabled?: boolean;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
  type: string;
  importance: number;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  placeholder = "Enter location",
  onLocationChange,
  onAddressChange,
  showCurrentLocation = true,
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<Location[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentLocationSearches');
    if (recent) {
      try {
        setRecentSearches(JSON.parse(recent).slice(0, 3)); // Keep only 3 recent
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    }
  }, []);

  // Update search query when value changes
  useEffect(() => {
    if (value?.address && value.address !== searchQuery) {
      setSearchQuery(value.address);
    }
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length > 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setShowResults(false);
      setSearchError(null);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&countrycodes=in&q=${encodeURIComponent(query)}`,
        {
          headers: {
            'User-Agent': 'RideShareApp/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Search service unavailable');
      }
      
      const data = await response.json();
      
      // Filter and sort results by importance
      const filteredResults = data
        .filter((result: SearchResult) => result.importance > 0.3)
        .sort((a: SearchResult, b: SearchResult) => b.importance - a.importance);
      
      setSearchResults(filteredResults);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchError('Unable to search locations. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = async (result: SearchResult) => {
    const location: Location = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name,
      formatted_address: result.display_name
    };

    setSearchQuery(result.display_name);
    setShowResults(false);
    setSearchError(null);
    
    // Save to recent searches
    const newRecentSearches = [
      location, 
      ...recentSearches.filter(l => l.address !== location.address)
    ].slice(0, 3);
    
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentLocationSearches', JSON.stringify(newRecentSearches));

    if (onLocationChange) {
      onLocationChange(location);
    }
    if (onAddressChange) {
      onAddressChange(result.display_name);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'RideShareApp/1.0'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            location.address = data.display_name;
            location.formatted_address = data.display_name;
            setSearchQuery(data.display_name);
          } else {
            throw new Error('Reverse geocoding failed');
          }
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
        
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGettingLocation(false);
        
        let errorMessage = 'Unable to get your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    if (onAddressChange) {
      onAddressChange(newValue);
    }
  };

  const handleFocus = () => {
    if (searchResults.length > 0 || recentSearches.length > 0) {
      setShowResults(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding results to allow clicking on them
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className="w-full pr-12 bg-transparent border-none focus:ring-0 focus:outline-none text-sm"
        />
        
        {showCurrentLocation && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isGettingLocation || disabled}
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            title="Use current location"
          >
            {isGettingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4 text-ride-primary" />
            )}
          </Button>
        )}
      </div>

      {/* Search Results */}
      {showResults && (searchResults.length > 0 || recentSearches.length > 0 || searchError) && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 border-card-border shadow-xl max-h-80 overflow-y-auto">
          <CardContent className="p-0">
            
            {/* Search Error */}
            {searchError && (
              <div className="p-4 text-center">
                <AlertCircle className="h-5 w-5 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-600">{searchError}</p>
              </div>
            )}
            
            {/* Search Results */}
            {searchResults.length > 0 && !searchError && (
              <div>
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Search Results</span>
                </div>
                {searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    onClick={() => selectLocation(result)}
                    className="w-full text-left px-4 py-3 hover:bg-muted/50 border-b border-border last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {result.display_name.split(',').slice(0, 2).join(', ')}
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
            {recentSearches.length > 0 && searchQuery.length <= 2 && !searchError && (
              <div>
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b">
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
                      type: 'recent',
                      importance: 1
                    })}
                    className="w-full text-left px-4 py-3 hover:bg-muted/50 border-b border-border last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {location.address?.split(',').slice(0, 2).join(', ')}
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
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="animate-spin h-4 w-4" />
                Searching locations...
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
