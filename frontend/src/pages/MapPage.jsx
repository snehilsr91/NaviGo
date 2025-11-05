import React, { useMemo } from "react";
import Navbar from "../components/Layout/Navbar";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { COLLEGE_CENTER, COLLEGE_ZOOM, CAMPUS_BOUNDS, BUILDINGS } from "../data/buildings";

const containerStyle = { width: "100%", height: "calc(100vh - 80px)" };

const MapPage = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const options = useMemo(
    () => ({
      mapTypeId: 'satellite',
      disableDefaultUI: false,
      clickableIcons: false,
      // allow free pan/zoom and smooth scroll
      gestureHandling: 'greedy',
      zoomControl: true,
      scrollwheel: true,
    }),
    []
  );

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

  const handleMapLoad = (map) => {
    if (CAMPUS_BOUNDS) {
      const bounds = new window.google.maps.LatLngBounds(
        { lat: CAMPUS_BOUNDS.south, lng: CAMPUS_BOUNDS.west },
        { lat: CAMPUS_BOUNDS.north, lng: CAMPUS_BOUNDS.east }
      );
      map.fitBounds(bounds);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <div className="pt-20">
        <GoogleMap
          mapContainerStyle={containerStyle}
          options={options}
          onLoad={handleMapLoad}
        >
          {BUILDINGS.map((b) => (
            <Marker
              key={b.id}
              position={b.position}
              label={{ text: b.name, className: "marker-label" }}
            />
          ))}
        </GoogleMap>
      </div>
    </div>
  );
};

export default MapPage;


