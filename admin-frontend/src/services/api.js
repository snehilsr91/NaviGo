import axios from 'axios';

// Get API URL from environment variable
let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Ensure the URL is absolute (starts with http:// or https://)
// If it doesn't, prepend https://
if (API_URL && !API_URL.match(/^https?:\/\//i)) {
  API_URL = `https://${API_URL}`;
}

// Remove trailing slash if present
API_URL = API_URL.replace(/\/$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Event Booking Request API
export const eventBookingRequestApi = {
  getAll: async (status = null) => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/event-booking-requests${params}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/event-booking-requests/${id}`);
    return response.data;
  },

  approve: async (id, adminNotes = null, reviewedBy = null) => {
    const response = await api.post(`/event-booking-requests/${id}/approve`, {
      adminNotes,
      reviewedBy,
    });
    return response.data;
  },

  reject: async (id, adminNotes = null, reviewedBy = null) => {
    const response = await api.post(`/event-booking-requests/${id}/reject`, {
      adminNotes,
      reviewedBy,
    });
    return response.data;
  },
};

// Admin API
export const adminApi = {
  getReviews: async () => {
    const response = await api.get('/admin/reviews');
    return response.data;
  },

  deleteReview: async (id) => {
    const response = await api.delete(`/admin/reviews/${id}`);
    return response.data;
  },

  getPhotos: async () => {
    const response = await api.get('/admin/photos');
    return response.data;
  },

  deletePhoto: async (buildingName, filename) => {
    const response = await api.delete(`/admin/photos/${buildingName}/${filename}`);
    return response.data;
  },
};

export default api;

