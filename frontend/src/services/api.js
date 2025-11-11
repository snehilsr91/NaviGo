import axios from 'axios';

// Create axios instance with base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
      const response = await api.get(`/buildings/${buildingId}/reviews`);
      return response.data;
    } catch (error) {
      console.error('Error fetching building reviews:', error);
      throw error;
    }
  },

  // Add a review with optional photo (as Base64 string)
  addReview: async (buildingId, comment, photo) => {
    try {
      const payload = {
        buildingId,
        comment: comment || '',
        photo: photo || null,
      };

      const response = await api.post(`/buildings/${buildingId}/reviews`, payload);
      return response.data;
    } catch (error) {
      console.error('Error adding building review:', error);
      throw error;
    }
  },
};

export default api;