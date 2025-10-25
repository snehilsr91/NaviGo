import React from "react";

const ARLabel = ({ poi }) => {
  return (
    <a-entity gps-entity-place={`latitude: ${poi.lat}; longitude: ${poi.lng};`}>
      <a-text
        value={poi.name}
        look-at="[gps-camera]"
        scale="20 20 20"
        color="yellow"
        align="center"
      ></a-text>
    </a-entity>
  );
};

export default ARLabel;
