import React, { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Layout/Navbar";
import { GoogleMap, Marker, InfoWindow, DirectionsRenderer, useLoadScript } from "@react-google-maps/api";
import { COLLEGE_CENTER, COLLEGE_ZOOM, CAMPUS_BOUNDS, BUILDINGS } from "../data/buildings";
import BuildingDetails from "../components/BuildingDetails";

const containerStyle = { width: "100%", height: "100%", borderRadius: "0" };

const MapPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mapRef = useRef();
  const [selected, setSelected] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [showDirections, setShowDirections] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [directionsRequested, setDirectionsRequested] = useState(false);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  // Check if API key is missing
  useEffect(() => {
    if (!googleMapsApiKey) {
      console.error('❌ VITE_GOOGLE_MAPS_API_KEY is not set!');
      console.error('💡 Please set VITE_GOOGLE_MAPS_API_KEY in your Vercel environment variables.');
    }
  }, [googleMapsApiKey]);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapsApiKey,
  });

  const options = useMemo(
    () => ({
      mapTypeId: 'roadmap',
      disableDefaultUI: false,
      clickableIcons: false,
      // allow free pan/zoom and smooth scroll
      gestureHandling: 'greedy',
      zoomControl: true,
      scrollwheel: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    }),
    []
  );

  const handleMapLoad = useCallback((map) => {
    console.log('🗺️ Map loaded successfully');
    mapRef.current = map;
    setIsMapReady(true);
    
    // Check if we have a building in URL params when map loads
    const label = new URLSearchParams(window.location.search).get('label');
    if (label) {
      console.log('🏢 Building label from URL:', label);
      const b = BUILDINGS.find(b => b.name.toLowerCase() === label.toLowerCase());
      if (b) {
        console.log('✅ Found building:', b.name);
        map.panTo(b.position);
        map.setZoom(19);
        setSelected(b);
        return; // Don't fit bounds if we're showing a specific building
      } else {
        console.warn('⚠️ Building not found in BUILDINGS data:', label);
      }
    }
    
    // Default: fit to campus bounds
    if (CAMPUS_BOUNDS) {
      const bounds = new window.google.maps.LatLngBounds(
        { lat: CAMPUS_BOUNDS.south, lng: CAMPUS_BOUNDS.west },
        { lat: CAMPUS_BOUNDS.north, lng: CAMPUS_BOUNDS.east }
      );
      map.fitBounds(bounds);
    }
  }, []);

  // Get user's current location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        setLocationError(null);
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationError("Unable to get your location. Please enable location permissions.");
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  }, []);

  // Calculate directions
  const calculateDirections = useCallback((destination) => {
    if (!userLocation) {
      console.warn('⚠️ Cannot calculate directions: User location not available');
      setLocationError("Please enable location permissions to get directions.");
      return;
    }
    
    if (!destination) {
      console.warn('⚠️ Cannot calculate directions: No destination provided');
      return;
    }
    
    if (!mapRef.current) {
      console.warn('⚠️ Cannot calculate directions: Map not ready');
      return;
    }
    
    if (!window.google || !window.google.maps) {
      console.warn('⚠️ Cannot calculate directions: Google Maps API not loaded');
      return;
    }

    console.log('🧭 Calculating directions from', userLocation, 'to', destination.name, destination.position);
    
    const directionsService = new window.google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin: userLocation,
        destination: destination.position,
        travelMode: window.google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === "OK") {
          console.log('✅ Directions calculated successfully');
          setDirections(result);
          setShowDirections(true);
          setDirectionsRequested(false);
          
          // Fit map to show the entire route
          const bounds = new window.google.maps.LatLngBounds();
          result.routes[0].legs[0].steps.forEach((step) => {
            bounds.extend(step.start_location);
            bounds.extend(step.end_location);
          });
          mapRef.current.fitBounds(bounds);
        } else {
          console.error("❌ Directions request failed:", status);
          setDirectionsRequested(false);
          alert(`Unable to calculate directions. Status: ${status}\nPlease try again or check your location settings.`);
        }
      }
    );
  }, [userLocation]);

  // Handle directions request from BuildingDetails
  const handleGetDirections = useCallback((building) => {
    if (!userLocation) {
      alert("Please enable location permissions to get directions.");
      return;
    }
    calculateDirections(building);
  }, [userLocation, calculateDirections]);

  // Handle go to place request from BuildingDetails
  const handleGoToPlace = useCallback((building) => {
    if (!mapRef.current || !building) {
      return;
    }
    // Clear any existing directions
    setShowDirections(false);
    setDirections(null);
    // Pan and zoom to the building
    mapRef.current.panTo(building.position);
    mapRef.current.setZoom(19);
  }, []);

  // Handle URL parameters and directions request
  useEffect(() => {
    const label = searchParams.get('label');
    const showDir = searchParams.get('directions') === 'true';
    
    console.log('🔄 URL params changed:', { 
      label, 
      showDir, 
      isMapReady, 
      isLoaded, 
      hasUserLocation: !!userLocation,
      buildingsCount: BUILDINGS.length 
    });
    
    if (!label) { 
      setSelected(null); 
      setShowDirections(false);
      setDirections(null);
      setDirectionsRequested(false);
      return; 
    }
    
    // Check if BUILDINGS array is empty
    if (!BUILDINGS || BUILDINGS.length === 0) {
      console.error('❌ BUILDINGS array is empty or undefined!');
      alert('Error: Building data not loaded. Please refresh the page.');
      return;
    }
    
    const b = BUILDINGS.find(b => b.name.toLowerCase() === label.toLowerCase());
    if (b) {
      console.log('🏢 Setting selected building:', b.name, 'Position:', b.position);
      setSelected(b);
      
      // Wait for map to be loaded before panning
      if (mapRef.current && isLoaded && isMapReady) {
        console.log('🗺️ Panning to building...');
        mapRef.current.panTo(b.position);
        mapRef.current.setZoom(19);
      }
      
      // If directions parameter is set, try to calculate directions
      if (showDir && !directionsRequested) {
        setDirectionsRequested(true);
        
        // Check if we have everything we need
        if (userLocation && mapRef.current && isLoaded && isMapReady) {
          console.log('✅ All prerequisites met, calculating directions...');
          setTimeout(() => calculateDirections(b), 500);
        } else {
          console.log('⏳ Waiting for prerequisites...', {
            hasUserLocation: !!userLocation,
            hasMapRef: !!mapRef.current,
            isLoaded,
            isMapReady
          });
          
          if (!userLocation) {
            console.warn('⚠️ User location not available yet. Directions will be calculated when location is available.');
            // Will retry when userLocation becomes available
          }
        }
      }
    } else {
      console.error('❌ Building not found:', label);
      console.error('Available buildings:', BUILDINGS.map(b => b.name));
      alert(`Building "${label}" not found. Please make sure the building name is correct.`);
    }
  }, [searchParams, userLocation, calculateDirections, isLoaded, isMapReady, directionsRequested]);
  
  // Retry directions calculation when user location becomes available
  useEffect(() => {
    const showDir = searchParams.get('directions') === 'true';
    if (showDir && userLocation && selected && isMapReady && isLoaded && directionsRequested) {
      console.log('🔄 User location now available, retrying directions...');
      setTimeout(() => calculateDirections(selected), 500);
    }
  }, [userLocation, selected, isMapReady, isLoaded, directionsRequested, searchParams, calculateDirections]);

  const handleCloseDetails = () => {
    setSelected(null);
    setShowDirections(false);
    setDirections(null);
    // Remove query params from URL
    setSearchParams({});
  };

  if (loadError || !googleMapsApiKey)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white relative">
        {/* Background Image with reduced opacity */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
          style={{ backgroundImage: 'url(/unnamed.jpg)' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/80 to-indigo-900/80"></div>
        
        <Navbar />

        <div className="pt-24 px-6 flex items-center justify-center h-screen relative z-10">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-2xl">
            <p className="text-xl font-semibold text-red-400 mb-4">
              {!googleMapsApiKey ? '⚠️ Google Maps API Key Missing' : 'Failed to load map'}
            </p>
            <div className="text-sm text-gray-300 space-y-2">
              {!googleMapsApiKey ? (
                <>
                  <p>The Google Maps API key is not configured in your deployment environment.</p>
                  <p className="mt-3 font-mono text-xs bg-black/30 p-3 rounded">
                    Please set <span className="text-cyan-400">VITE_GOOGLE_MAPS_API_KEY</span> in your Vercel environment variables.
                  </p>
                  <p className="mt-3">
                    <a 
                      href="https://vercel.com/docs/projects/environment-variables" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Learn how to add environment variables →
                    </a>
                  </p>
                </>
              ) : (
                <p>Please check your internet connection and try again.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  if (!isLoaded)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white relative">
        {/* Background Image with reduced opacity */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
          style={{ backgroundImage: 'url(/unnamed.jpg)' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/80 to-indigo-900/80"></div>
        
        <Navbar />

        <div className="pt-24 px-6 flex items-center justify-center h-screen relative z-10">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xl font-semibold">Loading map…</p>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white overflow-hidden relative flex flex-col">
      {/* Background Image with reduced opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: 'url(/unnamed.jpg)' }}
      ></div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/80 to-indigo-900/80"></div>
      
      <Navbar />

      <div className="pt-20 relative overflow-hidden" style={{ height: "calc(100vh - 80px)" }}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          options={options}
          onLoad={handleMapLoad}
          center={COLLEGE_CENTER}
          zoom={COLLEGE_ZOOM}
        >
          {/* User location marker */}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              }}
              title="Your Location"
            />
          )}
          
          {BUILDINGS.map((b) => (
            <Marker
              key={b.id}
              position={b.position}
              label={{ text: b.name, className: "marker-label" }}
              onClick={() => {
                setSelected(b);
                setShowDirections(false);
                setDirections(null);
                setSearchParams({ label: b.name });
              }}
            />
          ))}
          
          {/* Directions route */}
          {showDirections && directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: false,
                preserveViewport: false,
              }}
            />
          )}
        </GoogleMap>
        
        {/* Building Details Panel */}
        <div 
          className={`absolute top-0 left-0 h-full w-full md:w-[400px] pointer-events-none transition-transform duration-300 ease-in-out z-20 ${
            selected ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {selected && (
            <div className="pointer-events-auto h-full">
              <BuildingDetails 
                building={selected} 
                onGetDirections={handleGetDirections}
                onGoToPlace={handleGoToPlace}
                userLocation={userLocation}
                locationError={locationError}
                onClose={handleCloseDetails}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPage;


