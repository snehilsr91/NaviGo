import { useState, useEffect } from "react";

// Mock POI data
const MOCK_POIS = [
  { name: "Library", lat: 37.422, lng: -122.084 },
  { name: "Cafeteria", lat: 37.4219, lng: -122.0839 },
  { name: "Engineering Building", lat: 37.4222, lng: -122.0842 },
];

export const usePOIs = () => {
  const [pois, setPois] = useState([]);

  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => setPois(MOCK_POIS), 1000);
    return () => clearTimeout(timer);
  }, []);

  return { pois };
};
