import React from "react";

const ARLabel = ({ poi }) => {
  // Determine color based on POI type
  const getColor = () => {
    switch (poi.type) {
      case 'building':
        return 'green';
      case 'road':
        return 'blue';
      case 'detected':
        return 'red';
      default:
        return 'yellow';
    }
  };

  // Determine icon based on POI type
  const getIcon = () => {
    switch (poi.type) {
      case 'building':
        return '🏢';
      case 'road':
        return '🛣️';
      case 'detected':
        return '📷';
      default:
        return '📍';
    }
  };

  return (
    <a-entity gps-entity-place={`latitude: ${poi.lat}; longitude: ${poi.lng};`}>
      {/* Text label */}
      <a-text
        value={`${getIcon()} ${poi.name}`}
        look-at="[gps-camera]"
        scale="20 20 20"
        color={getColor()}
        align="center"
      ></a-text>
      
      {/* Visual indicator based on type */}
      {poi.type === 'building' && (
        <a-box
          color="green"
          opacity="0.5"
          scale="10 20 10"
          position="0 -25 0"
        ></a-box>
      )}
      
      {poi.type === 'road' && (
        <a-cylinder
          color="blue"
          opacity="0.5"
          radius="2"
          height="5"
          position="0 -10 0"
        ></a-cylinder>
      )}
    </a-entity>
  );
};

export default ARLabel;
