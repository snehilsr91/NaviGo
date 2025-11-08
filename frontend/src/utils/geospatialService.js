import { Loader } from '@googlemaps/js-api-loader';
import * as THREE from 'three';

class GeospatialService {
  constructor() {
    this.apiKey = (import.meta?.env?.VITE_GOOGLE_MAPS_API_KEY) || '';
    this.map = null;
    this.buildings = [];
    this.roads = [];
    this.isInitialized = false;
    this.useFallback = false;
    this.origin = { lat: 0, lng: 0 };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      const useMaps = (import.meta?.env?.VITE_USE_MAPS === 'true');
      if (!useMaps || !this.apiKey) {
        // No API key provided; use fallback mock data
        this.useFallback = true;
        this.isInitialized = true;
        console.warn('Using fallback geospatial data (Maps disabled or API key missing).');
        return;
      }

      // Load Google Maps API
      const loader = new Loader({
        apiKey: this.apiKey,
        version: 'weekly',
        libraries: ['places', 'visualization']
      });

      await loader.load();
      this.isInitialized = true;
      console.log('Google Maps API loaded successfully');
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

      if (this.useFallback) {
        const buildings = this.mockBuildingsNear(latitude, longitude);
        this.buildings = buildings;
        return buildings;
      }

      // Create a map instance if not already created
      if (!this.map) {
        const mapDiv = document.createElement('div');
        mapDiv.style.display = 'none';
        document.body.appendChild(mapDiv);
        
        this.map = new google.maps.Map(mapDiv, {
          center: { lat: latitude, lng: longitude },
          zoom: 18,
          mapTypeId: 'satellite',
          disableDefaultUI: true,
          gestureHandling: 'none',
          zoomControl: false,
          minZoom: 18,
          maxZoom: 18
        });
      } else {
        this.map.setCenter({ lat: latitude, lng: longitude });
      }

      // Use the Buildings API to get building data (placeholder; still using mock extraction)
      return new Promise((resolve) => {
        google.maps.event.addListenerOnce(this.map, 'idle', () => {
          const buildings = this.extractBuildingsFromMap();
          this.buildings = buildings;
          resolve(buildings);
        });
      });
    } catch (error) {
      console.error('Error detecting buildings:', error);
      return [];
    }
  }

  // Extract building data from the map
  extractBuildingsFromMap() {
    // In a real implementation, we would use the Google Maps API to extract building data
    // For now, we'll return mock data
    const cLat = this.map ? this.map.getCenter().lat() : this.origin.lat;
    const cLng = this.map ? this.map.getCenter().lng() : this.origin.lng;
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

      if (this.useFallback) {
        const roads = this.mockRoadsNear(latitude, longitude);
        this.roads = roads;
        return roads;
      }

      // Ensure map is initialized
      if (!this.map) {
        await this.detectBuildings(latitude, longitude, radius);
      } else {
        this.map.setCenter({ lat: latitude, lng: longitude });
      }

      // Use the Roads API to get road data (placeholder; still using mock extraction)
      return new Promise((resolve) => {
        google.maps.event.addListenerOnce(this.map, 'idle', () => {
          const roads = this.extractRoadsFromMap();
          this.roads = roads;
          resolve(roads);
        });
      });
    } catch (error) {
      console.error('Error detecting roads:', error);
      return [];
    }
  }

  // Extract road data from the map
  extractRoadsFromMap() {
    // In a real implementation, we would use the Google Maps API to extract road data
    // For now, we'll return mock data
    const cLat = this.map ? this.map.getCenter().lat() : this.origin.lat;
    const cLng = this.map ? this.map.getCenter().lng() : this.origin.lng;
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
        building.position.lng - (this.map ? this.map.getCenter().lng() : this.origin.lng),
        building.height / 2,
        building.position.lat - (this.map ? this.map.getCenter().lat() : this.origin.lat)
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
          point.lng - (this.map ? this.map.getCenter().lng() : this.origin.lng),
          0.1, // Slightly above ground
          point.lat - (this.map ? this.map.getCenter().lat() : this.origin.lat)
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
    const centerLat = this.map ? this.map.getCenter().lat() : 0;
    const centerLng = this.map ? this.map.getCenter().lng() : 0;
    
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