import React from "react";

const GeospatialControls = ({ 
  buildings, 
  roads, 
  onAddAsPOIs,
  onRefresh,
  isLoading 
}) => {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-50 bg-gray-900 bg-opacity-80 text-white p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Geospatial Detection</h3>
        <button
          onClick={onRefresh}
          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Scanning...
            </span>
          ) : "Scan Area"}
        </button>
      </div>
      
      <div className="flex space-x-2 mb-3">
        <div className="flex-1 bg-gray-800 p-2 rounded">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Buildings</span>
            <span className="text-xs bg-green-800 px-2 py-0.5 rounded-full">{buildings.length}</span>
          </div>
        </div>
        <div className="flex-1 bg-gray-800 p-2 rounded">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Roads</span>
            <span className="text-xs bg-blue-800 px-2 py-0.5 rounded-full">{roads.length}</span>
          </div>
        </div>
      </div>
      
      <button
        onClick={onAddAsPOIs}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg"
        disabled={buildings.length === 0 && roads.length === 0}
      >
        Add to AR View
      </button>
    </div>
  );
};

export default GeospatialControls;