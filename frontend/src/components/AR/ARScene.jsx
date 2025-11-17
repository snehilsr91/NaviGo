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
        <div className="min-h-screen bg-black text-white overflow-hidden relative">
          {/* Purple accent lines */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-32 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
            <div className="absolute top-60 left-10 w-px h-64 bg-gradient-to-b from-purple-500/20 to-transparent"></div>
            <div className="absolute bottom-40 right-20 w-px h-80 bg-gradient-to-t from-purple-500/20 to-transparent"></div>
            <div className="absolute top-1/3 right-1/4 w-32 h-32 border border-purple-500/15 rotate-45"></div>
            <div className="absolute top-32 right-1/4 w-32 h-32 border border-purple-500/20 bg-transparent rotate-45" style={{ borderColor: 'rgba(168, 85, 247, 0.2)' }}></div>
            <div className="absolute bottom-32 left-1/3 w-24 h-24 border border-purple-500/15 bg-transparent rotate-35" style={{ borderColor: 'rgba(168, 85, 247, 0.15)' }}></div>
            <div className="absolute top-1/2 right-10 w-16 h-16 border border-purple-500/25 bg-transparent -rotate-12" style={{ borderColor: 'rgba(168, 85, 247, 0.25)' }}></div>
          </div>

          <div className="relative z-10 pt-20 sm:pt-24 md:pt-28 px-4 sm:px-6 pb-8 sm:pb-10">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 sm:mb-4 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent px-2">
                  AR Detection & Navigation
                </h1>
                <p className="text-gray-300 text-base sm:text-lg px-2 mb-4">
                  Experience immersive navigation with real-time AR overlays
                </p>
              </div>

              {/* Action Cards */}
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-black/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300">
                  <button
                    onClick={handleStartDetection}
                    className="w-full px-6 py-4 sm:py-5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 active:from-purple-500 active:to-purple-600 text-white rounded-lg sm:rounded-xl shadow-lg transition-all duration-300 text-base sm:text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px] flex items-center justify-center gap-3"
                    disabled={isLoading}
                  >
                    <span className="text-2xl sm:text-3xl">🎯</span>
                    <span>Start AR Detection</span>
                  </button>
                </div>
                
                <div className="bg-black/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300">
                  <button
                    onClick={handleStartLocationDetection}
                    className="w-full px-6 py-4 sm:py-5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 active:from-purple-500 active:to-purple-600 text-white rounded-lg sm:rounded-xl shadow-lg transition-all duration-300 text-base sm:text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px] flex items-center justify-center gap-3"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Detecting Location...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl sm:text-3xl">📍</span>
                        <span>Start Location Detection</span>
                      </>
                    )}
                  </button>
                </div>
                
                {locationError && (
                  <div className="bg-red-500/10 backdrop-blur-lg border border-red-500/40 rounded-xl p-4 animate-fade-in shadow-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <h3 className="font-bold text-red-400">Error</h3>
                        <p className="text-red-300">{locationError}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-black/60 backdrop-blur-lg rounded-lg sm:rounded-xl p-4 sm:p-5 border border-purple-500/20">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-lg sm:text-xl text-purple-400 flex-shrink-0">💡</span>
                    <div className="text-xs sm:text-sm text-gray-300">
                      <p className="font-semibold mb-1.5 sm:mb-2 text-purple-300">How it works:</p>
                      <ul className="space-y-1 list-disc list-inside text-gray-400 leading-relaxed">
                        <li>Camera and location access will be requested when you start</li>
                        <li>AR Detection identifies objects in real-time using your camera</li>
                        <li>Location Detection finds your current building based on GPS</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {mode === "detection" && (
        <div className="w-full h-full">
          <ObjectDetectorSimple onDetection={handleDetection} />
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
