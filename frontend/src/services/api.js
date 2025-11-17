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

// Teacher Location API endpoints
export const teacherLocationApi = {
  // Find teacher location
  findTeacher: async (teacherName) => {
    try {
      if (!teacherName || !teacherName.trim()) {
        throw new Error('Teacher name is required');
      }
      
      const response = await api.get(`/teachers/find`, {
        params: { teacher: teacherName }
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        // Server responded with error
        if (error.response.status === 404) {
          throw new Error(`Teacher "${teacherName}" not found in our records.`);
        }
        throw new Error(error.response.data?.message || `Failed to find teacher: ${error.response.status}`);
      } else if (error.request) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      } else {
        throw new Error(`Error finding teacher: ${error.message}`);
      }
    }
  },

  // Get all teachers list
  getAllTeachers: async () => {
    try {
      const response = await api.get('/teachers/list');
      return response.data;
    } catch (error) {
      console.error('Error fetching teachers list:', error);
      throw error;
    }
  },
};

// Events API endpoints
export const eventsApi = {
  // Get all events (with optional filters)
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      
      const response = await api.get(`/events?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },
  
  // Get a single event by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/events/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  },
  
  // Create a new event
  create: async (eventData) => {
    try {
      const response = await api.post('/events', eventData);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to create event');
      }
      throw new Error('Error creating event: ' + error.message);
    }
  },
  
  // Update an event
  update: async (id, eventData) => {
    try {
      const response = await api.put(`/events/${id}`, eventData);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to update event');
      }
      throw new Error('Error updating event: ' + error.message);
    }
  },
  
  // Delete an event
  delete: async (id) => {
    try {
      const response = await api.delete(`/events/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to delete event');
      }
      throw new Error('Error deleting event: ' + error.message);
    }
  },
  
  // Register for an event
  register: async (id, registrationData) => {
    try {
      const response = await api.post(`/events/${id}/register`, registrationData);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to register for event');
      }
      throw new Error('Error registering for event: ' + error.message);
    }
  },
  
  // Book auditorium for an event
  bookAuditorium: async (id, auditoriumName) => {
    try {
      const response = await api.post(`/events/${id}/book-auditorium`, { auditoriumName });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to book auditorium');
      }
      throw new Error('Error booking auditorium: ' + error.message);
    }
  },
};

// Event Booking Request API endpoints
export const eventBookingRequestApi = {
  // Create a booking request
  create: async (requestData) => {
    try {
      const response = await api.post('/event-booking-requests', requestData);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to submit booking request');
      }
      throw new Error('Error submitting booking request: ' + error.message);
    }
  },
  
  // Check auditorium availability
  checkAvailability: async (auditoriumName, startTime, endTime, excludeRequestId = null) => {
    try {
      const params = new URLSearchParams({
        auditoriumName,
        startTime: startTime instanceof Date ? startTime.toISOString() : startTime,
        endTime: endTime instanceof Date ? endTime.toISOString() : endTime,
      });
      if (excludeRequestId) {
        params.append('excludeRequestId', excludeRequestId);
      }
      
      const response = await api.get(`/event-booking-requests/check-availability?${params.toString()}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to check availability');
      }
      throw new Error('Error checking availability: ' + error.message);
    }
  },
  
  // Get all booking requests (admin)
  getAll: async (status = null) => {
    try {
      const params = status ? `?status=${status}` : '';
      const response = await api.get(`/event-booking-requests${params}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch booking requests');
      }
      throw new Error('Error fetching booking requests: ' + error.message);
    }
  },
  
  // Get a single booking request
  getById: async (id) => {
    try {
      const response = await api.get(`/event-booking-requests/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch booking request');
      }
      throw new Error('Error fetching booking request: ' + error.message);
    }
  },
  
  // Approve a booking request (admin)
  approve: async (id, adminNotes = null, reviewedBy = null) => {
    try {
      const response = await api.post(`/event-booking-requests/${id}/approve`, {
        adminNotes,
        reviewedBy,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to approve booking request');
      }
      throw new Error('Error approving booking request: ' + error.message);
    }
  },
  
  // Reject a booking request (admin)
  reject: async (id, adminNotes = null, reviewedBy = null) => {
    try {
      const response = await api.post(`/event-booking-requests/${id}/reject`, {
        adminNotes,
        reviewedBy,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to reject booking request');
      }
      throw new Error('Error rejecting booking request: ' + error.message);
    }
  },
};

// Admin API endpoints
export const adminApi = {
  // Get all reviews for moderation
  getReviews: async () => {
    try {
      const response = await api.get('/admin/reviews');
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch reviews');
      }
      throw new Error('Error fetching reviews: ' + error.message);
    }
  },
  
  // Delete a review
  deleteReview: async (id) => {
    try {
      const response = await api.delete(`/admin/reviews/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to delete review');
      }
      throw new Error('Error deleting review: ' + error.message);
    }
  },
  
  // Get all photos for moderation
  getPhotos: async () => {
    try {
      const response = await api.get('/admin/photos');
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch photos');
      }
      throw new Error('Error fetching photos: ' + error.message);
    }
  },
  
  // Delete a photo
  deletePhoto: async (buildingName, filename) => {
    try {
      const response = await api.delete(`/admin/photos/${buildingName}/${filename}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to delete photo');
      }
      throw new Error('Error deleting photo: ' + error.message);
    }
  },
};

export default api;