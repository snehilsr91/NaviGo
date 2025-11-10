import "@ar-js-org/ar.js";
import React, { useState, useEffect, useRef } from "react";
import ARLabel from "./ARLabel";
import ObjectDetector from "./ObjectDetector";
import GeospatialControls from "./GeospatialControls";
import { usePOIs } from "../../hooks/usePOIs";
import geospatialService from "../../utils/geospatialService";

const ARScene = () => {
  const { pois, addPOI } = usePOIs();
  const [mode, setMode] = useState("ar"); // "ar", "detection", or "geospatial"
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [roads, setRoads] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGeospatialControls, setShowGeospatialControls] = useState(false);
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
          console.error("Error getting geolocation:", error);
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
  useEffect(() => {
    if (mode === "geospatial" && userLocation) {
      detectBuildingsAndRoads();
    }
  }, [mode, userLocation]);

  const handleDetection = (objects) => {
    setDetectedObjects(objects);
  };

  const handleModeToggle = () => {
    if (mode === "ar") {
      setMode("detection");
    } else if (mode === "detection") {
      setMode("geospatial");
    } else {
      setMode("ar");
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
    <div className="relative w-full h-screen">
      {mode === "ar" ? (
        <a-scene
          ref={sceneRef}
          vr-mode-ui="enabled: false"
          embedded
          arjs="sourceType: webcam; debugUIEnabled: false;"
          style={{ width: "100%", height: "100vh" }}
        >
          {/* Camera setup */}
          <a-camera gps-camera></a-camera>

          {/* Render POIs */}
          {pois.map((poi, idx) => (
            <ARLabel key={idx} poi={poi} />
          ))}
        </a-scene>
      ) : mode === "detection" ? (
        <ObjectDetector onDetection={handleDetection} />
      ) : (
        <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-4">
          <h2 className="text-2xl mb-4">Geospatial Detection</h2>
          {userLocation ? (
            <div className="w-full max-w-md">
              <p className="mb-2">Current Location: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}</p>
              
              <div className="mb-4">
                <h3 className="text-xl mb-2">Buildings ({buildings.length})</h3>
                <div className="max-h-40 overflow-y-auto bg-gray-800 p-2 rounded">
                  {buildings.map((building, idx) => (
                    <div key={idx} className="mb-1 p-1 border-b border-gray-700">
                      {building.name || `Building ${idx + 1}`}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-xl mb-2">Roads ({roads.length})</h3>
                <div className="max-h-40 overflow-y-auto bg-gray-800 p-2 rounded">
                  {roads.map((road, idx) => (
                    <div key={idx} className="mb-1 p-1 border-b border-gray-700">
                      {road.name || `Road ${idx + 1}`}
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => convertGeospatialToPOIs(buildings, roads)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg mb-2"
                disabled={buildings.length === 0 && roads.length === 0}
              >
                Add Buildings & Roads as POIs
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p>Waiting for location data...</p>
              <div className="mt-4 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          )}
        </div>
      )}

      {/* Mode toggle button */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
        <button
          onClick={handleModeToggle}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow-lg text-sm font-bold min-h-[44px] touch-manipulation"
          style={{ touchAction: 'manipulation' }}
        >
          {mode === "ar" ? "🔍 Detection" : mode === "detection" ? "🌍 Geospatial" : "📱 AR"}
        </button>
        
        {mode === "detection" && detectedObjects.length > 0 && (
          <button
            onClick={convertDetectionsToPOIs}
            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg text-sm font-bold min-h-[44px] touch-manipulation"
            style={{ touchAction: 'manipulation' }}
          >
            ✅ Add POIs
          </button>
        )}
      </div>

      {/* Geospatial Controls in AR mode */}
      {mode === "ar" && showGeospatialControls && (
        <GeospatialControls
          buildings={buildings}
          roads={roads}
          onAddAsPOIs={() => convertGeospatialToPOIs(buildings, roads)}
          onRefresh={detectBuildingsAndRoads}
          isLoading={isLoading}
        />
      )}

      {/* Scan button in AR mode when controls are not shown */}
      {mode === "ar" && !showGeospatialControls && userLocation && (
        <button
          onClick={detectBuildingsAndRoads}
          className="absolute bottom-4 left-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg"
          disabled={isLoading}
        >
          {isLoading ? "Scanning..." : "Scan for Buildings & Roads"}
        </button>
      )}
    </div>
  );
};

export default ARScene;
