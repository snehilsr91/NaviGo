import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BuildingDetectionModal = ({ isOpen, onClose, building, confidence }) => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'photos', 'reviews'

  // Dynamic building info (can be expanded with actual data from backend)
  const getBuildingInfo = (placeName) => {
    // Default info for any place
    return {
      name: placeName || 'Unknown Place',
      description: `${placeName || 'This place'} is a location in the National Institute of Engineering campus, Mysore.`,
      mapLabel: placeName || 'Unknown Place'
    };
  };

  useEffect(() => {
    if (isOpen && building) {
      loadBuildingData();
    }
  }, [isOpen, building]);

  const loadBuildingData = async () => {
    if (!building) return;
    
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const apiBaseUrl = API_URL.replace('/api', '');
      
      // Encode place name for URL
      const encodedPlaceName = encodeURIComponent(building);
      
      // Load photos from backend for the detected place
      try {
        const photoApiUrl = `${apiBaseUrl}/api/buildings/${encodedPlaceName}/photos`;
        console.log('Fetching photos from:', photoApiUrl);
        const photosResponse = await axios.get(photoApiUrl);
        console.log('Photos response:', photosResponse.data);
        const photoUrls = photosResponse.data.photos || [];
        // Convert relative URLs to absolute URLs
        const fullPhotoUrls = photoUrls.map(photo => {
          if (photo.startsWith('http')) {
            return photo; // Already absolute
          }
          // If relative, prepend base URL
          const fullUrl = photo.startsWith('/') 
            ? `${apiBaseUrl}${photo}` 
            : `${apiBaseUrl}/${photo}`;
          console.log(`Converting photo URL: ${photo} -> ${fullUrl}`);
          return fullUrl;
        });
        setPhotos(fullPhotoUrls);
        console.log(`✅ Loaded ${fullPhotoUrls.length} photos for ${building}:`, fullPhotoUrls);
      } catch (err) {
        console.error('❌ Error loading photos:', err);
        console.error('Error details:', err.response?.data || err.message);
        setPhotos([]);
      }

      // Load reviews if available
      try {
        const reviewsResponse = await axios.get(`${API_URL}/buildings/${encodedPlaceName}/reviews`);
        setReviews(reviewsResponse.data || []);
      } catch (err) {
        console.log('No reviews available yet');
        setReviews([]);
      }
    } catch (error) {
      console.error('Error loading building data:', error);
      setPhotos([]);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOnMap = () => {
    if (building) {
      const info = getBuildingInfo(building);
      // Navigate to map with building label
      navigate(`/map?label=${encodeURIComponent(info.mapLabel)}`);
      onClose();
    }
  };

  const handleViewReviews = () => {
    setActiveTab('reviews');
  };

  if (!isOpen) return null;

  const info = building ? getBuildingInfo(building) : {};

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-white/20 animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 relative">
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
              <span className="text-3xl">🏛️</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{info.name || building || 'Place Detected'}</h2>
              <p className="text-emerald-100 text-sm">Place Detected! ({Math.round((confidence || 0) * 100)}% confidence)</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 px-4 font-semibold transition-colors ${
              activeTab === 'info'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex-1 py-3 px-4 font-semibold transition-colors ${
              activeTab === 'photos'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Photos ({photos.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-3 px-4 font-semibold transition-colors ${
              activeTab === 'reviews'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            </div>
          ) : (
            <>
              {/* Info Tab */}
              {activeTab === 'info' && (
                <div className="space-y-4 text-white">
                  <div>
                    <h3 className="text-lg font-semibold text-cyan-300 mb-2">Description</h3>
                    <p className="text-gray-300">{info.description}</p>
                  </div>
                  {info.departments && (
                    <div>
                      <h3 className="text-lg font-semibold text-cyan-300 mb-2">Departments</h3>
                      <div className="flex flex-wrap gap-2">
                        {info.departments.map((dept, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-500/30 rounded-full text-sm"
                          >
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {info.floors && (
                    <div>
                      <h3 className="text-lg font-semibold text-cyan-300 mb-2">Floors</h3>
                      <p className="text-gray-300">{info.floors}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Photos Tab */}
              {activeTab === 'photos' && (
                <div className="grid grid-cols-2 gap-4">
                  {photos.length > 0 ? (
                    photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`${building} - Photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-white/10 group-hover:border-cyan-400 transition-all"
                          onError={(e) => {
                            console.error(`Failed to load image: ${photo}`);
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <p className="col-span-2 text-center text-gray-400 py-8">
                      No photos available yet
                    </p>
                  )}
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((review, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <p className="text-gray-300">{review.comment}</p>
                        {review.photo && (
                          <img
                            src={review.photo}
                            alt="Review"
                            className="mt-2 w-full h-32 object-cover rounded"
                          />
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(review.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-400 py-8">
                      No reviews available yet
                    </p>
                  )}
                </div>
              )}
            </>
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
            onClick={handleViewReviews}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <span className="flex items-center justify-center gap-2">
              <span>💬</span>
              <span>Reviews</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuildingDetectionModal;

