import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Navbar from "../components/Layout/Navbar";
import { COLLEGE_CENTER, COLLEGE_ZOOM, CAMPUS_BOUNDS, BUILDINGS } from "../data/buildings";
import BuildingDetails from "../components/BuildingDetails";

// Helper function to check if a point is within campus bounds
const isWithinCampus = (lat, lng) => {
  if (!CAMPUS_BOUNDS) return true;
  return (
    lat >= CAMPUS_BOUNDS.south &&
    lat <= CAMPUS_BOUNDS.north &&
    lng >= CAMPUS_BOUNDS.west &&
    lng <= CAMPUS_BOUNDS.east
  );
};

// Helper function to constrain a point to campus bounds
const constrainToCampus = (lat, lng) => {
  if (!CAMPUS_BOUNDS) return { lat, lng };
  return {
    lat: Math.max(CAMPUS_BOUNDS.south, Math.min(CAMPUS_BOUNDS.north, lat)),
    lng: Math.max(CAMPUS_BOUNDS.west, Math.min(CAMPUS_BOUNDS.east, lng))
  };
};

// Create a campus-constrained path between two points
const createCampusPath = (start, end) => {
  const startConstrained = constrainToCampus(start.lat, start.lng);
  const endConstrained = constrainToCampus(end.lat, end.lng);
  
  // Create a simple path with intermediate points that stay within campus
  // Use a few waypoints to create a smoother path
  const numPoints = 10;
  const path = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const ratio = i / numPoints;
    const lat = startConstrained.lat + (endConstrained.lat - startConstrained.lat) * ratio;
    const lng = startConstrained.lng + (endConstrained.lng - startConstrained.lng) * ratio;
    
    // Ensure point is within campus
    const constrained = constrainToCampus(lat, lng);
    path.push([constrained.lat, constrained.lng]);
  }
  
  return path;
};

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom component to handle map view updates
function MapController({ center, zoom, bounds, selectedBuilding, routeBounds }) {
  const map = useMap();
  
  useEffect(() => {
    if (routeBounds) {
      // Fit map to show the entire route
      map.fitBounds(routeBounds, { padding: [50, 50] });
    } else if (selectedBuilding) {
      map.setView([selectedBuilding.position.lat, selectedBuilding.position.lng], 19);
    } else if (bounds) {
      map.fitBounds([
        [bounds.south, bounds.west],
        [bounds.north, bounds.east]
      ]);
    } else if (center) {
      map.setView([center.lat, center.lng], zoom || COLLEGE_ZOOM);
    }
  }, [map, center, zoom, bounds, selectedBuilding, routeBounds]);
  
  return null;
}

const MapPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [routeBounds, setRouteBounds] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [showDirections, setShowDirections] = useState(false);
  const [directionsRequested, setDirectionsRequested] = useState(false);

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

  // Calculate directions using OSRM routing API
  const calculateDirections = useCallback(async (destination) => {
    if (!userLocation) {
      console.warn('⚠️ Cannot calculate directions: User location not available');
      setLocationError("Please enable location permissions to get directions.");
      return;
    }
    
    if (!destination) {
      console.warn('⚠️ Cannot calculate directions: No destination provided');
      return;
    }

    console.log('🧭 Calculating directions from', userLocation, 'to', destination.name, destination.position);
    
    try {
      setDirectionsRequested(true);
      
      // Use OSRM (Open Source Routing Machine) for road-based routing
      // Using walking mode (more appropriate for campus navigation)
      const startLng = userLocation.lng;
      const startLat = userLocation.lat;
      const endLng = destination.position.lng;
      const endLat = destination.position.lat;
      
      // Check if both points are within campus
      const startInCampus = isWithinCampus(startLat, startLng);
      const endInCampus = isWithinCampus(endLat, endLng);
      
      // If both points are within campus, try OSRM walking route
      let route = null;
      let routeStaysInCampus = true;
      
      if (startInCampus && endInCampus) {
        try {
          // OSRM route API endpoint - using walking profile for campus navigation
          const osrmUrl = `https://router.project-osrm.org/route/v1/walking/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
          
          const response = await fetch(osrmUrl);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
              // Extract the route geometry (array of [lng, lat] coordinates)
              const routeGeometry = data.routes[0].geometry.coordinates;
              
              // Convert from [lng, lat] to [lat, lng] for Leaflet
              route = routeGeometry.map(coord => [coord[1], coord[0]]);
              
              // Check if route stays within campus bounds
              routeStaysInCampus = route.every(point => isWithinCampus(point[0], point[1]));
              
              if (!routeStaysInCampus) {
                console.warn('⚠️ OSRM route goes outside campus bounds, using campus-constrained path');
                route = null; // Will use campus path instead
              } else {
                console.log('✅ Route calculated successfully and stays within campus:', route.length, 'points');
              }
            }
          }
        } catch (osrmError) {
          console.warn('⚠️ OSRM routing failed, using campus-constrained path:', osrmError);
        }
      }
      
      // If OSRM route is not available or goes outside campus, use campus-constrained path
      if (!route || !routeStaysInCampus) {
        console.log('📍 Creating campus-constrained path');
        route = createCampusPath(
          { lat: startLat, lng: startLng },
          { lat: endLat, lng: endLng }
        );
      }
      
      // Calculate bounds for the route
      if (route.length > 0) {
        const bounds = L.latLngBounds(route);
        setRouteBounds(bounds);
      }
      
      setDirections(route);
      setShowDirections(true);
      setDirectionsRequested(false);
    } catch (error) {
      console.error('❌ Error calculating route:', error);
      setDirectionsRequested(false);
      
      // Fallback to straight line if routing fails
      console.warn('⚠️ Falling back to straight line route');
      const fallbackRoute = [
        [userLocation.lat, userLocation.lng],
        [destination.position.lat, destination.position.lng]
      ];
      
      // Set bounds for fallback route
      const fallbackBounds = L.latLngBounds(fallbackRoute);
      setRouteBounds(fallbackBounds);
      
      setDirections(fallbackRoute);
      setShowDirections(true);
      
      alert(`Unable to calculate road-based directions. Showing straight-line route.\n\nError: ${error.message}`);
    }
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
    if (!building) {
      return;
    }
    // Clear any existing directions
    setShowDirections(false);
    setDirections(null);
    setSelected(building);
    setSearchParams({ label: building.name });
  }, [setSearchParams]);

  // Handle URL parameters and directions request
  useEffect(() => {
    const label = searchParams.get('label');
    const showDir = searchParams.get('directions') === 'true';
    
    console.log('🔄 URL params changed:', { 
      label, 
      showDir, 
      hasUserLocation: !!userLocation,
      buildingsCount: BUILDINGS.length 
    });
    
    if (!label) { 
      setSelected(null); 
      setShowDirections(false);
      setDirections(null);
      setRouteBounds(null);
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
      
      // If directions parameter is set, try to calculate directions
      if (showDir && !directionsRequested) {
        setDirectionsRequested(true);
        
        // Check if we have everything we need
        if (userLocation) {
          console.log('✅ All prerequisites met, calculating directions...');
          setTimeout(() => calculateDirections(b), 500);
        } else {
          console.warn('⚠️ User location not available yet. Directions will be calculated when location is available.');
        }
      }
    } else {
      console.error('❌ Building not found:', label);
      console.error('Available buildings:', BUILDINGS.map(b => b.name));
      alert(`Building "${label}" not found. Please make sure the building name is correct.`);
    }
  }, [searchParams, userLocation, calculateDirections, directionsRequested]);
  
  // Retry directions calculation when user location becomes available
  useEffect(() => {
    const showDir = searchParams.get('directions') === 'true';
    if (showDir && userLocation && selected && directionsRequested) {
      console.log('🔄 User location now available, retrying directions...');
      setTimeout(() => calculateDirections(selected), 500);
    }
  }, [userLocation, selected, directionsRequested, searchParams, calculateDirections]);

  const handleCloseDetails = () => {
    setSelected(null);
    setShowDirections(false);
    setDirections(null);
    setRouteBounds(null);
    // Remove query params from URL
    setSearchParams({});
  };

  // Create custom icon with label for buildings
  const createBuildingIconWithLabel = useCallback((buildingName) => {
    return L.divIcon({
      className: 'custom-marker-label',
      html: `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: translateY(-10px);
        ">
          <img 
            src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png" 
            style="
              width: 25px;
              height: 41px;
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            "
            alt="marker"
          />
          <div style="
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(124, 58, 237, 0.95));
            backdrop-filter: blur(10px);
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            margin-top: 4px;
            border: 1px solid rgba(167, 139, 250, 0.5);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            text-align: center;
            max-width: 150px;
            word-wrap: break-word;
          ">
            ${buildingName}
          </div>
        </div>
      `,
      iconSize: [25, 60],
      iconAnchor: [12, 60],
      popupAnchor: [0, -60]
    });
  }, []);

  // Create custom icons
  const userLocationIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <div className="h-screen bg-black text-white overflow-hidden relative flex flex-col">
      <Navbar />

      <div className="flex-1 relative overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
        <MapContainer
          center={[COLLEGE_CENTER.lat, COLLEGE_CENTER.lng]}
          zoom={COLLEGE_ZOOM}
          style={{ height: "100%", width: "100%", zIndex: 1 }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController 
            center={COLLEGE_CENTER} 
            zoom={COLLEGE_ZOOM} 
            bounds={!selected && !showDirections ? CAMPUS_BOUNDS : null}
            selectedBuilding={selected && !showDirections ? selected : null}
            routeBounds={showDirections ? routeBounds : null}
          />
          
          {/* User location marker */}
          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userLocationIcon}
            >
              <Popup>Your Location</Popup>
            </Marker>
          )}
          
          {/* Building markers with labels */}
          {BUILDINGS.map((b) => (
            <Marker
              key={b.id}
              position={[b.position.lat, b.position.lng]}
              icon={createBuildingIconWithLabel(b.name)}
              eventHandlers={{
                click: () => {
                  setSelected(b);
                  setShowDirections(false);
                  setDirections(null);
                  setRouteBounds(null);
                  setSearchParams({ label: b.name });
                },
              }}
            >
              <Popup>{b.name}</Popup>
            </Marker>
          ))}
          
          {/* Directions route */}
          {showDirections && directions && (
            <Polyline
              positions={directions}
              color="purple"
              weight={4}
              opacity={0.7}
            />
          )}
        </MapContainer>
        
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
