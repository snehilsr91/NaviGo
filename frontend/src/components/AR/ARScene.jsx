import "aframe";
import "ar.js";
import React, { useState } from "react";
import ARLabel from "./ARLabel";
import ObjectDetector from "./ObjectDetector";
import { usePOIs } from "../../hooks/usePOIs";

const ARScene = () => {
  const { pois, addPOI } = usePOIs();
  const [mode, setMode] = useState("ar"); // "ar" or "detection"
  const [detectedObjects, setDetectedObjects] = useState([]);

  const handleDetection = (objects) => {
    setDetectedObjects(objects);
  };

  const handleModeToggle = () => {
    setMode(mode === "ar" ? "detection" : "ar");
  };

  // Convert detected objects to POIs
  const convertDetectionsToPOIs = () => {
    // In a real app, we would use geolocation to get lat/lng
    // For now, we'll create mock coordinates
    const newPOIs = detectedObjects.map((obj, index) => ({
      id: `detected-${Date.now()}-${index}`,
      name: obj.class,
      lat: (Math.random() - 0.5) * 0.001, // Mock coordinates
      lng: (Math.random() - 0.5) * 0.001, // Mock coordinates
      type: 'detected'
    }));
    
    // Add each new POI
    newPOIs.forEach(poi => addPOI(poi));
    
    // Switch back to AR mode to see the labels
    setMode("ar");
  };

  return (
    <div className="relative w-full h-screen">
      {mode === "ar" ? (
        <a-scene
          vr-mode-ui="enabled: false"
          embedded
          arjs="sourceType: webcam; debugUIEnabled: false;"
          style={{ width: "100%", height: "100vh" }}
        >
          {/* Camera setup */}
          <a-camera gps-camera rotation-reader></a-camera>

          {/* Render POIs */}
          {pois.map((poi, idx) => (
            <ARLabel key={idx} poi={poi} />
          ))}
        </a-scene>
      ) : (
        <ObjectDetector onDetection={handleDetection} />
      )}

      {/* Mode toggle button */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={handleModeToggle}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow-lg"
        >
          {mode === "ar" ? "Switch to Detection" : "Switch to AR"}
        </button>
        
        {mode === "detection" && detectedObjects.length > 0 && (
          <button
            onClick={convertDetectionsToPOIs}
            className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg"
          >
            Add as POIs
          </button>
        )}
      </div>
    </div>
  );
};

export default ARScene;
