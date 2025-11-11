import axios from 'axios';

// Create axios instance with base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Warn if API URL is not set in production
if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.error('❌ VITE_API_URL is not set! API calls will fail in production.');
  console.error('💡 Please set VITE_API_URL environment variable in your deployment platform.');
}

// Log API URL in development to help debug
if (import.meta.env.DEV) {
  console.log('🌐 API URL:', API_URL);
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.url}`, response.status);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error(`❌ API Error: ${error.config?.url}`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('❌ API Error: No response from server', {
        url: error.config?.url,
        message: error.message,
      });
    } else {
      // Something else happened
      console.error('❌ API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Detection API endpoints
export const detectionsApi = {
  // Get all detections
  getAll: async () => {
    try {
      const response = await api.get('/detections');
      return response.data;
    } catch (error) {
      console.error('Error fetching detections:', error);
      throw error;
    }
  },
  
  // Get latest detection
  getLatest: async () => {
    try {
      const response = await api.get('/detections/latest');
      return response.data;
    } catch (error) {
      console.error('Error fetching latest detection:', error);
      throw error;
    }
  },
  
  // Create new detection
  create: async (detections) => {
    try {
      const response = await api.post('/detections', { detections });
      return response.data;
    } catch (error) {
      console.error('Error creating detection:', error);
      throw error;
    }
  },
  
  // Reset all detections
  reset: async () => {
    try {
      const response = await api.delete('/detections/reset');
      return response.data;
    } catch (error) {
      console.error('Error resetting detections:', error);
      throw error;
    }
  },
};

// Building Reviews API endpoints
export const buildingReviewsApi = {
  // Get all reviews for a building
  getReviews: async (buildingId) => {
    try {
      if (!buildingId) {
        throw new Error('Building ID is required');
      }
      
      const response = await api.get(`/buildings/${buildingId}/reviews`);
      
      // Ensure we always return an array
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      // Provide more detailed error information
      if (error.response) {
        // Server responded with error
        if (error.response.status === 404) {
          console.warn(`⚠️ Building ${buildingId} not found or no reviews exist`);
          return []; // Return empty array for 404 (building might not have reviews yet)
        }
        throw new Error(`Failed to fetch reviews: ${error.response.status} ${error.response.statusText}`);
      } else if (error.request) {
        // Request was made but no response
        throw new Error('Unable to connect to server. Please check your internet connection and ensure the backend is running.');
      } else {
        // Something else
        throw new Error(`Error fetching reviews: ${error.message}`);
      }
    }
  },

  // Add a review with optional photo (as Base64 string)
  addReview: async (buildingId, comment, photo) => {
    try {
      if (!buildingId) {
        throw new Error('Building ID is required');
      }
      
      const payload = {
        buildingId,
        comment: comment || '',
        photo: photo || null,
      };

      const response = await api.post(`/buildings/${buildingId}/reviews`, payload);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.error || `Failed to add review: ${error.response.status}`);
      } else if (error.request) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      } else {
        throw new Error(`Error adding review: ${error.message}`);
      }
    }
  },
};

export default api;