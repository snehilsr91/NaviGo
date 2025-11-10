import React, { useMemo, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Layout/Navbar";
import { GoogleMap, Marker, InfoWindow, useLoadScript } from "@react-google-maps/api";
import { COLLEGE_CENTER, COLLEGE_ZOOM, CAMPUS_BOUNDS, BUILDINGS } from "../data/buildings";
import BuildingDetails from "../components/BuildingDetails";

const containerStyle = { width: "100%", height: "calc(100vh - 80px)" };

const MapPage = () => {
  const [searchParams] = useSearchParams();
  const mapRef = useRef();
  const [selected, setSelected] = useState(null);

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

  useEffect(() => {
    const label = searchParams.get('label');
    if (!label) { setSelected(null); return; }
    const b = BUILDINGS.find(b => b.name.toLowerCase() === label.toLowerCase());
    if (b) {
      setSelected(b);
      if (mapRef.current) {
        mapRef.current.panTo(b.position);
        mapRef.current.setZoom(19);
      }
    }
  }, [searchParams]);

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
          {BUILDINGS.map((b) => (
            <Marker
              key={b.id}
              position={b.position}
              label={{ text: b.name, className: "marker-label" }}
              onClick={() => setSelected(b)}
            />
          ))}
          {selected && (
            <InfoWindow
              position={selected.position}
              onCloseClick={() => setSelected(null)}
            >
              <BuildingDetails building={selected} />
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export default MapPage;


