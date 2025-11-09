// Utility functions for building management
import { BUILDINGS } from '../data/buildings';

/**
 * Check if a building has coordinates in the buildings data
 * @param {string} buildingName - Name of the building to check
 * @returns {boolean} - True if building has coordinates
 */
export function hasBuildingCoordinates(buildingName) {
  return BUILDINGS.some(building => 
    building.name.toLowerCase() === buildingName.toLowerCase()
  );
}

/**
 * Filter buildings to only include those with coordinates
 * @param {string[]} buildingNames - Array of building names
 * @returns {string[]} - Filtered array with only buildings that have coordinates
 */
export function filterBuildingsWithCoordinates(buildingNames) {
  if (!buildingNames || !Array.isArray(buildingNames)) {
    return [];
  }
  
  return buildingNames.filter(buildingName => hasBuildingCoordinates(buildingName));
}

/**
 * Get building data by name
 * @param {string} buildingName - Name of the building
 * @returns {Object|null} - Building data or null if not found
 */
export function getBuildingData(buildingName) {
  return BUILDINGS.find(building => 
    building.name.toLowerCase() === buildingName.toLowerCase()
  ) || null;
}