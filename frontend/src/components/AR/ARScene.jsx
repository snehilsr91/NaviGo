import "@ar-js-org/ar.js";
import React, { useState, useEffect, useRef } from "react";
import ARLabel from "./ARLabel";
import ObjectDetectorSimple from "./ObjectDetectorSimple";
import GeospatialControls from "./GeospatialControls";
import LocationDetectionResult from "./LocationDetectionResult";
import { usePOIs } from "../../hooks/usePOIs";
import geospatialService from "../../utils/geospatialService";
import { getCurrentLocation, detectCurrentBuilding } from "../../utils/locationDetector";

const ARScene = () => {
  const { pois, addPOI } = usePOIs();
  const [mode, setMode] = useState("menu"); // "menu", "ar", "detection", or "geospatial"
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [roads, setRoads] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGeospatialControls, setShowGeospatialControls] = useState(false);
  const [locationResult, setLocationResult] = useState(null);
  const [showLocationResult, setShowLocationResult] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const sceneRef = useRef(null);

  // Initialize geolocation tracking
  useEffect(() => {
    let watchId = null;
    if (navigator.geolocation && window.isSecureContext) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          // Only log geolocation errors in development mode
          if (import.meta.env.DEV) {
            console.warn("Geolocation access denied or unavailable, using fallback location");
          }
          // Fallback to a default location (e.g., Bangalore)
          setUserLocation({ lat: 12.9716, lng: 77.5946 });
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    } else {
      // Non-secure context (http on non-localhost): use fallback
      setUserLocation({ lat: 12.9716, lng: 77.5946 });
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Detect buildings and roads when in geospatial mode and location changes
  // NOTE: This functionality is currently disabled due to hardcoded/mock data issues
  // useEffect(() => {
  //   if (mode === "geospatial" && userLocation) {
  //     detectBuildingsAndRoads();
  //   }
  // }, [mode, userLocation]);

  const handleDetection = (objects) => {
    setDetectedObjects(objects);
  };

  const handleModeToggle = () => {
    // Simplified mode switching - only AR and Detection modes
    if (mode === "ar") {
      setMode("detection");
    } else {
      setMode("ar");
    }
  };



  const handleStartDetection = () => {
    setMode("detection");
  };

  const handleStartLocationDetection = async () => {
    setIsLoading(true);
    setLocationError(null);
    
    try {
      // Get user's current location
      const location = await getCurrentLocation();
      setUserLocation(location);
      
      // Detect current building based on location
      const result = detectCurrentBuilding(location.lat, location.lng);
      
      if (result) {
        setLocationResult(result);
        setShowLocationResult(true);
      } else {
        setLocationError('No buildings found nearby');
      }
    } catch (error) {
      console.error('Location detection error:', error);
      setLocationError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Detect buildings and roads using GeospatialService
  const detectBuildingsAndRoads = async () => {
    if (!userLocation) return;
    
    try {
      setIsLoading(true);
      
      // Initialize geospatial service if needed
      if (!geospatialService.isInitialized) {
        await geospatialService.initialize();
      }
      
      // Detect buildings
      const detectedBuildings = await geospatialService.detectBuildings(
        userLocation.lat,
        userLocation.lng
      );
      setBuildings(detectedBuildings);
      
      // Detect roads
      const detectedRoads = await geospatialService.detectRoads(
        userLocation.lat,
        userLocation.lng
      );
      setRoads(detectedRoads);
      
      // Show geospatial controls when detection is complete
      setShowGeospatialControls(true);
    } catch (error) {
      console.error("Error detecting buildings and roads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert detected objects to POIs
  const convertDetectionsToPOIs = () => {
    // In a real app, we would use geolocation to get lat/lng
    // For now, we'll create mock coordinates
    const newPOIs = detectedObjects.map((obj, index) => ({
      id: `detected-${Date.now()}-${index}`,
      name: obj.class,
      lat: userLocation ? userLocation.lat + (Math.random() - 0.5) * 0.001 : (Math.random() - 0.5) * 0.001,
      lng: userLocation ? userLocation.lng + (Math.random() - 0.5) * 0.001 : (Math.random() - 0.5) * 0.001,
      type: 'detected'
    }));
    
    // Add each new POI
    newPOIs.forEach(poi => addPOI(poi));
    
    // Switch back to AR mode to see the labels
    setMode("ar");
  };
  
  // Convert geospatial data to POIs
  const convertGeospatialToPOIs = (buildings, roads) => {
    // Convert buildings to POIs
    const buildingPOIs = buildings.map((building, index) => ({
      id: `building-${Date.now()}-${index}`,
      name: building.name || `Building ${index + 1}`,
      lat: building.position.lat,
      lng: building.position.lng,
      type: 'building',
      height: building.height,
      footprint: building.footprint
    }));
    
    // Convert roads to POIs
    const roadPOIs = roads.map((road, index) => ({
      id: `road-${Date.now()}-${index}`,
      name: road.name || `Road ${index + 1}`,
      lat: road.path[0].lat,
      lng: road.path[0].lng,
      type: 'road',
      path: road.path
    }));
    
    // Add all POIs
    [...buildingPOIs, ...roadPOIs].forEach(poi => addPOI(poi));
  };

  // Render 3D models for buildings and roads
  const renderGeospatialModels = () => {
    if (!sceneRef.current || !userLocation) return;
    
    // Clear existing models
    const existingModels = sceneRef.current.querySelectorAll('.geospatial-model');
    existingModels.forEach(model => model.parentNode.removeChild(model));
    
    // Create building models
    const buildingModels = geospatialService.createBuildingModels();
    buildingModels.forEach(model => {
      const entity = document.createElement('a-entity');
      entity.classList.add('geospatial-model');
      entity.setAttribute('geometry', {
        primitive: 'box',
        width: 10,
        height: model.mesh.geometry.parameters.height,
        depth: 10
      });
      entity.setAttribute('material', { color: '#00ff00', opacity: 0.5 });
      
      // Position the entity using AR.js's GPS system
      const arPosition = geospatialService.geoToAR(
        model.position.lat,
        model.position.lng
      );
      entity.setAttribute('position', arPosition);
      
      // Add to scene
      sceneRef.current.appendChild(entity);
    });
    
    // Create road models
    const roadModels = geospatialService.createRoadModels();
    roadModels.forEach(model => {
      model.path.forEach((point, index) => {
        if (index < model.path.length - 1) {
          const start = geospatialService.geoToAR(point.lat, point.lng, 0.1);
          const end = geospatialService.geoToAR(
            model.path[index + 1].lat,
            model.path[index + 1].lng,
            0.1
          );
          
          const entity = document.createElement('a-entity');
          entity.classList.add('geospatial-model');
          entity.setAttribute('line', {
            start: `${start.x} ${start.y} ${start.z}`,
            end: `${end.x} ${end.y} ${end.z}`,
            color: model.mesh.material.color.getHexString(),
            opacity: 0.8
          });
          
          // Add to scene
          sceneRef.current.appendChild(entity);
        }
      });
    });
  };


  return (
    <div className="relative w-full h-full overflow-hidden">
      {mode === "menu" && (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 pt-20 relative">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70"
            style={{ backgroundImage: 'url(/unnamed.jpg)' }}
          ></div>
          {/* Gradient overlay - more transparent */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-purple-900/50 to-indigo-900/50"></div>
          <div className="relative z-10 w-full">
          <div className="text-center max-w-lg mx-auto p-4 sm:p-12">
            <div className="space-y-6">
              <button
                onClick={handleStartDetection}
                className="w-full px-6 py-5 sm:px-8 sm:py-6 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 text-white rounded-2xl shadow-2xl text-lg sm:text-xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-cyan-500/25 active:scale-95 backdrop-blur-sm border border-cyan-500/20"
                disabled={isLoading}
              >
                <div className="flex items-center justify-center space-x-3">
                  <span className="text-xl sm:text-2xl">🎯</span>
                  <span>Start AR Detection</span>
                </div>
              </button>
              
              <button
                onClick={handleStartLocationDetection}
                className="w-full px-6 py-5 sm:px-8 sm:py-6 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-500 hover:via-green-500 hover:to-teal-500 text-white rounded-2xl shadow-2xl text-lg sm:text-xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-emerald-500/25 active:scale-95 backdrop-blur-sm border border-emerald-500/20"
                disabled={isLoading}
              >
                <div className="flex items-center justify-center space-x-3">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Detecting Location...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl sm:text-2xl">📍</span>
                      <span>Start Location Detection</span>
                    </>
                  )}
                </div>
              </button>
              
              {locationError && (
                <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-red-500/50">
                  <p className="text-red-200 text-sm flex items-center justify-center space-x-2">
                    <span>⚠️</span>
                    <span>{locationError}</span>
                  </p>
                </div>
              )}
              
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <p className="text-gray-300 text-sm flex items-center justify-center space-x-2">
                  <span className="text-cyan-400">📹</span>
                  <span>Camera/Location access will be requested when you start</span>
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}
      
      {mode === "detection" && (
        <div className="detection-container w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 pt-24 sm:pt-28 pb-4 sm:pb-6 relative">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70"
            style={{ backgroundImage: 'url(/unnamed.jpg)' }}
          ></div>
          {/* Gradient overlay - more transparent */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-purple-900/50 to-indigo-900/50"></div>
          <div className="detection-wrapper w-full max-w-6xl mx-auto h-full flex flex-col px-4 relative z-10">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-2 sm:p-6 border border-gray-700/30 shadow-2xl flex-1 flex flex-col overflow-hidden">
              <ObjectDetectorSimple onDetection={handleDetection} />
            </div>
          </div>
        </div>
      )}

      {/* Back to Menu button */}
      {mode !== "menu" && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs px-4">
          <button
            onClick={() => setMode("menu")}
            className="w-full px-5 py-3 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-xl shadow-xl text-base font-semibold min-h-[44px] touch-manipulation transition-all duration-200 transform hover:scale-105 active:scale-95 border border-gray-500/30 backdrop-blur-sm"
            style={{ touchAction: 'manipulation' }}
          >
            ← Back to Menu
          </button>
        </div>
      )}

      {/* Location Detection Result Modal */}
      {showLocationResult && (
        <LocationDetectionResult
          result={locationResult}
          userLocation={userLocation}
          onClose={() => {
            setShowLocationResult(false);
            setLocationResult(null);
          }}
        />
      )}
    </div>
  );
};

export default ARScene;
