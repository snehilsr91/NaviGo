import React, { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Layout/Navbar";
import { GoogleMap, Marker, InfoWindow, DirectionsRenderer, useLoadScript } from "@react-google-maps/api";
import { COLLEGE_CENTER, COLLEGE_ZOOM, CAMPUS_BOUNDS, BUILDINGS } from "../data/buildings";
import BuildingDetails from "../components/BuildingDetails";

const containerStyle = { width: "100%", height: "calc(100vh - 80px)" };

const MapPage = () => {
  const [searchParams] = useSearchParams();
  const mapRef = useRef();
  const [selected, setSelected] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [showDirections, setShowDirections] = useState(false);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
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

  const handleMapLoad = (map) => {
    mapRef.current = map;
    if (CAMPUS_BOUNDS) {
      const bounds = new window.google.maps.LatLngBounds(
        { lat: CAMPUS_BOUNDS.south, lng: CAMPUS_BOUNDS.west },
        { lat: CAMPUS_BOUNDS.north, lng: CAMPUS_BOUNDS.east }
      );
      map.fitBounds(bounds);
    }
  };

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
    if (!userLocation || !destination || !mapRef.current) {
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin: userLocation,
        destination: destination.position,
        travelMode: window.google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);
          setShowDirections(true);
          
          // Fit map to show the entire route
          const bounds = new window.google.maps.LatLngBounds();
          result.routes[0].legs[0].steps.forEach((step) => {
            bounds.extend(step.start_location);
            bounds.extend(step.end_location);
          });
          mapRef.current.fitBounds(bounds);
        } else {
          console.error("Directions request failed:", status);
          alert("Unable to calculate directions. Please try again.");
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

  useEffect(() => {
    const label = searchParams.get('label');
    const showDir = searchParams.get('directions') === 'true';
    
    if (!label) { 
      setSelected(null); 
      setShowDirections(false);
      setDirections(null);
      return; 
    }
    
    const b = BUILDINGS.find(b => b.name.toLowerCase() === label.toLowerCase());
    if (b) {
      setSelected(b);
      if (mapRef.current) {
        mapRef.current.panTo(b.position);
        mapRef.current.setZoom(19);
      }
      
      // If directions parameter is set and we have user location, show directions
      if (showDir && userLocation) {
        setTimeout(() => calculateDirections(b), 500);
      }
    }
  }, [searchParams, userLocation, calculateDirections]);

  if (loadError)
    return (
      <div className="min-h-screen bg-white text-gray-900">
        <Navbar />
        <div className="pt-24 px-6">Failed to load map.</div>
      </div>
    );
  if (!isLoaded)
    return (
      <div className="min-h-screen bg-white text-gray-900">
        <Navbar />
        <div className="pt-24 px-6">Loading map…</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <div className="pt-20">
        <GoogleMap
          mapContainerStyle={containerStyle}
          options={options}
          onLoad={handleMapLoad}
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
          
          {selected && (
            <InfoWindow
              position={selected.position}
              onCloseClick={() => {
                setSelected(null);
                setShowDirections(false);
                setDirections(null);
              }}
            >
              <BuildingDetails 
                building={selected} 
                onGetDirections={handleGetDirections}
                userLocation={userLocation}
                locationError={locationError}
              />
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export default MapPage;


