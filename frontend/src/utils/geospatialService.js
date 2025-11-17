import * as THREE from 'three';

class GeospatialService {
  constructor() {
    this.positionStackApiKey = (import.meta?.env?.VITE_POSITIONSTACK_API_KEY) || '';
    this.map = null;
    this.buildings = [];
    this.roads = [];
    this.isInitialized = false;
    this.useFallback = true; // Always use fallback for now (PositionStack is for geocoding, not map rendering)
    this.origin = { lat: 0, lng: 0 };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // PositionStack is primarily for geocoding, not map rendering
      // For AR features, we use fallback mock data
      this.useFallback = true;
      this.isInitialized = true;
      console.log('GeospatialService initialized with fallback mode (PositionStack available for geocoding if needed).');
    } catch (error) {
      console.warn('Error initializing GeospatialService, switching to fallback:', error);
      this.useFallback = true;
      this.isInitialized = true;
    }
  }

  // Detect buildings in the current view
  async detectBuildings(latitude, longitude, radius = 100) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.origin = { lat: latitude, lng: longitude };

      // Use fallback mock data (PositionStack is for geocoding, not building detection)
      const buildings = this.mockBuildingsNear(latitude, longitude);
      this.buildings = buildings;
      return buildings;
    } catch (error) {
      console.error('Error detecting buildings:', error);
      return [];
    }
  }

  // Extract building data from the map (deprecated - using mock data)
  extractBuildingsFromMap() {
    // Using mock data for AR features
    const cLat = this.origin.lat;
    const cLng = this.origin.lng;
    return [
      {
        id: 'building-1',
        name: 'Building 1',
        position: { lat: cLat + 0.0005, lng: cLng + 0.0003 },
        height: 30,
        footprint: [
          { lat: cLat + 0.0005, lng: cLng + 0.0003 },
          { lat: cLat + 0.0005, lng: cLng + 0.0008 },
          { lat: cLat + 0.0010, lng: cLng + 0.0008 },
          { lat: cLat + 0.0010, lng: cLng + 0.0003 }
        ]
      },
      {
        id: 'building-2',
        name: 'Building 2',
        position: { lat: cLat - 0.0008, lng: cLng - 0.0005 },
        height: 20,
        footprint: [
          { lat: cLat - 0.0008, lng: cLng - 0.0005 },
          { lat: cLat - 0.0008, lng: cLng - 0.0010 },
          { lat: cLat - 0.0012, lng: cLng - 0.0010 },
          { lat: cLat - 0.0012, lng: cLng - 0.0005 }
        ]
      }
    ];
  }

  // Fallback mock buildings near origin
  mockBuildingsNear(latitude, longitude) {
    const cLat = latitude;
    const cLng = longitude;
    return [
      {
        id: 'building-1',
        name: 'Building 1',
        position: { lat: cLat + 0.0004, lng: cLng + 0.0002 },
        height: 28,
        footprint: [
          { lat: cLat + 0.0004, lng: cLng + 0.0002 },
          { lat: cLat + 0.0004, lng: cLng + 0.0006 },
          { lat: cLat + 0.0008, lng: cLng + 0.0006 },
          { lat: cLat + 0.0008, lng: cLng + 0.0002 }
        ]
      },
      {
        id: 'building-2',
        name: 'Building 2',
        position: { lat: cLat - 0.0006, lng: cLng - 0.0004 },
        height: 22,
        footprint: [
          { lat: cLat - 0.0006, lng: cLng - 0.0004 },
          { lat: cLat - 0.0006, lng: cLng - 0.0009 },
          { lat: cLat - 0.0010, lng: cLng - 0.0009 },
          { lat: cLat - 0.0010, lng: cLng - 0.0004 }
        ]
      }
    ];
  }

  // Detect roads in the current view
  async detectRoads(latitude, longitude, radius = 100) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.origin = { lat: latitude, lng: longitude };

      // Use fallback mock data (PositionStack is for geocoding, not road detection)
      const roads = this.mockRoadsNear(latitude, longitude);
      this.roads = roads;
      return roads;
    } catch (error) {
      console.error('Error detecting roads:', error);
      return [];
    }
  }

  // Extract road data from the map (deprecated - using mock data)
  extractRoadsFromMap() {
    // Using mock data for AR features
    const cLat = this.origin.lat;
    const cLng = this.origin.lng;
    return [
      {
        id: 'road-1',
        name: 'Main Street',
        type: 'major',
        path: [
          { lat: cLat + 0.001, lng: cLng - 0.002 },
          { lat: cLat + 0.001, lng: cLng + 0.002 }
        ]
      },
      {
        id: 'road-2',
        name: 'Side Road',
        type: 'minor',
        path: [
          { lat: cLat - 0.001, lng: cLng - 0.001 },
          { lat: cLat + 0.001, lng: cLng - 0.001 }
        ]
      }
    ];
  }

  // Fallback mock roads near origin
  mockRoadsNear(latitude, longitude) {
    const cLat = latitude;
    const cLng = longitude;
    return [
      {
        id: 'road-1',
        name: 'Main Street',
        type: 'major',
        path: [
          { lat: cLat + 0.001, lng: cLng - 0.0015 },
          { lat: cLat + 0.001, lng: cLng + 0.0015 }
        ]
      },
      {
        id: 'road-2',
        name: 'Side Road',
        type: 'minor',
        path: [
          { lat: cLat - 0.001, lng: cLng - 0.001 },
          { lat: cLat + 0.001, lng: cLng - 0.001 }
        ]
      }
    ];
  }

  // Create 3D models for buildings to use in AR
  createBuildingModels() {
    return this.buildings.map(building => {
      // Create a simple box geometry for each building
      const geometry = new THREE.BoxGeometry(10, building.height, 10);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position the mesh based on the building's position
      mesh.position.set(
        building.position.lng - this.origin.lng,
        building.height / 2,
        building.position.lat - this.origin.lat
      );
      
      return {
        id: building.id,
        name: building.name,
        mesh: mesh,
        position: building.position
      };
    });
  }

  // Create 3D models for roads to use in AR
  createRoadModels() {
    return this.roads.map(road => {
      // Create a line for each road
      const points = road.path.map(point => 
        new THREE.Vector3(
          point.lng - this.origin.lng,
          0.1, // Slightly above ground
          point.lat - this.origin.lat
        )
      );
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: road.type === 'major' ? 0xff0000 : 0x0000ff,
        linewidth: road.type === 'major' ? 3 : 1
      });
      const line = new THREE.Line(geometry, material);
      
      return {
        id: road.id,
        name: road.name,
        mesh: line,
        path: road.path
      };
    });
  }

  // Convert geospatial coordinates to AR coordinates
  geoToAR(latitude, longitude, altitude = 0) {
    // This is a simplified conversion - in a real app, you would use proper geospatial calculations
    const centerLat = this.origin.lat || 0;
    const centerLng = this.origin.lng || 0;
    
    // Convert to meters (very approximate)
    const latMeters = (latitude - centerLat) * 111000;
    const lngMeters = (longitude - centerLng) * 111000 * Math.cos(centerLat * Math.PI / 180);
    
    return {
      x: lngMeters,
      y: altitude,
      z: -latMeters // Negative because AR.js uses a different coordinate system
    };
  }
}

// Create and export a singleton instance
const geospatialService = new GeospatialService();
export default geospatialService;