/**
 * Location-based building detection
 * Uses GPS coordinates to determine which building the user is currently in or near
 */

import { BUILDINGS } from '../data/buildings';

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters
  return distance;
}

/**
 * Get user's current location
 * @returns {Promise<Object>} Location object with lat and lng
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred.';
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Find the nearest building to a given location
 * @param {number} userLat - User's latitude
 * @param {number} userLng - User's longitude
 * @returns {Object} Nearest building with distance information
 */
export function findNearestBuilding(userLat, userLng) {
  if (!BUILDINGS || BUILDINGS.length === 0) {
    return null;
  }

  const buildingsWithDistance = BUILDINGS.map((building) => {
    const distance = calculateDistance(
      userLat,
      userLng,
      building.position.lat,
      building.position.lng
    );

    return {
      ...building,
      distance: distance, // in meters
      distanceText: formatDistance(distance),
    };
  });

  // Sort by distance (closest first)
  buildingsWithDistance.sort((a, b) => a.distance - b.distance);

  return buildingsWithDistance;
}

/**
 * Determine if user is inside a building (within threshold distance)
 * @param {number} userLat - User's latitude
 * @param {number} userLng - User's longitude
 * @param {number} threshold - Distance threshold in meters (default: 30m)
 * @returns {Object|null} Building object if inside, null otherwise
 */
export function detectCurrentBuilding(userLat, userLng, threshold = 30) {
  const nearestBuildings = findNearestBuilding(userLat, userLng);
  
  if (!nearestBuildings || nearestBuildings.length === 0) {
    return null;
  }

  const nearest = nearestBuildings[0];

  // If user is within threshold distance, consider them inside/at the building
  if (nearest.distance <= threshold) {
    return {
      building: nearest,
      status: 'inside',
      message: `You are at ${nearest.name}`,
      nearbyBuildings: nearestBuildings.slice(1, 4), // Get 3 nearby buildings
    };
  }

  // Otherwise, show nearest buildings
  return {
    building: nearest,
    status: 'nearby',
    message: `Nearest building: ${nearest.name} (${nearest.distanceText} away)`,
    nearbyBuildings: nearestBuildings.slice(1, 4),
  };
}

/**
 * Format distance in human-readable format
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance string
 */
function formatDistance(meters) {
  if (meters < 1) {
    return 'Right here';
  } else if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(2)}km`;
  }
}

/**
 * Get direction from user to building (N, NE, E, SE, S, SW, W, NW)
 * @param {number} userLat - User's latitude
 * @param {number} userLng - User's longitude
 * @param {number} buildingLat - Building's latitude
 * @param {number} buildingLng - Building's longitude
 * @returns {string} Direction string
 */
export function getDirection(userLat, userLng, buildingLat, buildingLng) {
  const bearing = calculateBearing(userLat, userLng, buildingLat, buildingLng);
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Calculate bearing from point 1 to point 2
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Bearing in degrees (0-360)
 */
function calculateBearing(lat1, lon1, lat2, lon2) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;

  return bearing;
}

export default {
  getCurrentLocation,
  findNearestBuilding,
  detectCurrentBuilding,
  getDirection,
};

