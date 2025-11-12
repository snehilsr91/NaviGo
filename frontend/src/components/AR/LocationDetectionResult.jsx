import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getDirection } from '../../utils/locationDetector';

const LocationDetectionResult = ({ result, userLocation, onClose }) => {
  const navigate = useNavigate();

  if (!result) return null;

  const { building, status, message, nearbyBuildings } = result;

  const handleViewOnMap = () => {
    navigate(`/map?label=${encodeURIComponent(building.name)}`);
    onClose();
  };

  const getStatusColor = () => {
    return status === 'inside' ? 'from-emerald-500 to-green-600' : 'from-blue-500 to-indigo-600';
  };

  const getStatusIcon = () => {
    return status === 'inside' ? '📍' : '🧭';
  };

  const getDirectionToBuilding = (targetBuilding) => {
    if (!userLocation) return '';
    return getDirection(
      userLocation.lat,
      userLocation.lng,
      targetBuilding.position.lat,
      targetBuilding.position.lng
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Content */}
      <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-white/20 animate-slide-up">
        {/* Header */}
        <div className={`bg-gradient-to-r ${getStatusColor()} p-6 relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <span className="text-3xl">{getStatusIcon()}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Location Detected</h2>
              <p className="text-white/90 text-sm">{message}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* Current/Nearest Building */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">{building.name}</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className={`px-3 py-1 rounded-full font-semibold ${
                    status === 'inside' 
                      ? 'bg-emerald-500/30 text-emerald-200' 
                      : 'bg-blue-500/30 text-blue-200'
                  }`}>
                    {status === 'inside' ? '✓ You are here' : `${building.distanceText} away`}
                  </span>
                  {userLocation && status !== 'inside' && (
                    <span className="px-3 py-1 bg-purple-500/30 text-purple-200 rounded-full font-semibold">
                      {getDirectionToBuilding(building)} direction
                    </span>
                  )}
                </div>
              </div>
            </div>

            {userLocation && (
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-gray-400 mb-1">Your Location</p>
                  <p className="text-white font-mono text-xs">
                    {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-gray-400 mb-1">Accuracy</p>
                  <p className="text-white font-semibold">
                    ±{Math.round(userLocation.accuracy || 0)}m
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Nearby Buildings */}
          {nearbyBuildings && nearbyBuildings.length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-cyan-300 mb-3">Nearby Buildings</h4>
              <div className="space-y-3">
                {nearbyBuildings.map((nearbyBuilding, index) => (
                  <div
                    key={nearbyBuilding.id || index}
                    className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:border-cyan-400/50 transition-all cursor-pointer"
                    onClick={() => {
                      navigate(`/map?label=${encodeURIComponent(nearbyBuilding.name)}`);
                      onClose();
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="text-white font-semibold">{nearbyBuilding.name}</h5>
                        <p className="text-gray-400 text-sm">
                          {nearbyBuilding.distanceText} • {getDirectionToBuilding(nearbyBuilding)} direction
                        </p>
                      </div>
                      <div className="text-2xl">
                        {index === 0 ? '🥈' : index === 1 ? '🥉' : '📍'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 bg-slate-900/50 border-t border-white/10 flex gap-4">
          <button
            onClick={handleViewOnMap}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <span className="flex items-center justify-center gap-2">
              <span>🗺️</span>
              <span>View on Map</span>
            </span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 border border-white/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationDetectionResult;

