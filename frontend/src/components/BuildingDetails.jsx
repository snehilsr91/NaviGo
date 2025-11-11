import React, { useState, useEffect, useCallback } from "react";
import { buildingReviewsApi } from "../services/api";

// Get base URL for static file serving (uploads are served directly, not through /api)
const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  // Remove /api suffix if present to get base URL
  return apiUrl.replace(/\/api$/, "");
};

const API_URL = getBaseUrl();

const BuildingDetails = ({ building, onGetDirections, onGoToPlace, userLocation, locationError }) => {
  const [reviews, setReviews] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [comment, setComment] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!building || building.id === "main-gate") {
      setLoading(false);
      setReviews([]);
      setPhotos([]);
      return;
    }

    try {
      setLoading(true);
      const [reviewsData, photosData] = await Promise.all([
        buildingReviewsApi.getReviews(building.id),
        buildingReviewsApi.getPhotos(building.id),
      ]);
      setReviews(reviewsData);
      setPhotos(photosData);
    } catch (error) {
      console.error("Error loading building data:", error);
      setReviews([]);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [building]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      alert("You can only upload up to 5 photos");
      return;
    }
    setSelectedPhotos(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() && selectedPhotos.length === 0) {
      alert("Please add a comment or at least one photo");
      return;
    }

    try {
      setSubmitting(true);
      await buildingReviewsApi.addReview(building.id, comment, selectedPhotos);
      setComment("");
      setSelectedPhotos([]);
      setShowAddForm(false);
      await loadData();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!building) {
    return null;
  }

  if (building.id === "main-gate") {
    return (
      <div className="p-4 max-w-sm bg-gradient-to-br from-slate-800 to-purple-900 rounded-xl border border-purple-400/20">
        <h3 className="text-lg font-bold text-white mb-2">{building.name}</h3>
        <p className="text-sm text-gray-300">Reviews and photos are not available for the main gate.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 max-w-sm bg-gradient-to-br from-slate-800 to-purple-900 rounded-xl border border-purple-400/20">
        <h3 className="text-lg font-bold text-white mb-2">{building.name}</h3>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-sm w-80 max-h-[500px] overflow-y-auto bg-gradient-to-br from-slate-800 to-purple-900 rounded-xl border border-purple-400/20 shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">{building.name}</h3>

      {/* Photos Section */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-cyan-300 mb-3 flex items-center gap-2">
          <span>📸</span> Photos
        </h4>
        {photos.length === 0 ? (
          <p className="text-xs text-gray-400 mb-2 bg-white/5 rounded-lg p-2 text-center">None yet</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-2">
            {photos.map((photo, idx) => (
              <img
                key={idx}
                src={`${API_URL}${photo.url}`}
                alt={`Building photo ${idx + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-white/20 hover:border-cyan-400/50 transition-colors"
              />
            ))}
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
          <span>💬</span> Comments
        </h4>
        {reviews.filter((r) => r.comment && r.comment.trim()).length === 0 ? (
          <p className="text-xs text-gray-400 mb-2 bg-white/5 rounded-lg p-2 text-center">None yet</p>
        ) : (
          <div className="space-y-2 mb-2">
            {reviews
              .filter((r) => r.comment && r.comment.trim())
              .map((review, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm p-3 rounded-lg text-xs text-gray-200 border border-white/10">
                  <p className="leading-relaxed">{review.comment}</p>
                  <p className="text-gray-400 text-xs mt-2">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mb-3 space-y-2">
        {/* Go to Place Button */}
        {onGoToPlace && (
          <button
            onClick={() => onGoToPlace(building)}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-sm py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 font-bold transform hover:scale-105"
          >
            📍 Go to Place
          </button>
        )}

        {/* Get Directions Button */}
        {onGetDirections && (
          <>
            {locationError ? (
              <div className="text-xs text-red-300 mb-2 p-2 bg-red-500/20 rounded-lg border border-red-400/30">
                {locationError}
              </div>
            ) : userLocation ? (
              <button
                onClick={() => onGetDirections(building)}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 font-bold transform hover:scale-105"
              >
                🧭 Get Directions
              </button>
            ) : (
              <button
                disabled
                className="w-full bg-gray-600/50 text-gray-400 text-sm py-3 px-4 rounded-lg cursor-not-allowed"
              >
                Getting your location...
              </button>
            )}
          </>
        )}
      </div>

      {/* Add Review Form */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 font-bold transform hover:scale-105"
        >
          Add Comment or Photo
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (optional)"
            className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-sm resize-none text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400"
            rows="3"
          />
          <div>
            <label className="block text-xs text-cyan-300 mb-2 font-semibold">
              Add photos (up to 5)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              className="w-full text-xs text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500"
            />
            {selectedPhotos.length > 0 && (
              <p className="text-xs text-cyan-300 mt-2 font-semibold">
                {selectedPhotos.length} photo(s) selected
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm py-3 px-4 rounded-lg transition-all duration-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setComment("");
                setSelectedPhotos([]);
              }}
              className="flex-1 bg-gray-600/50 hover:bg-gray-600 text-white text-sm py-3 px-4 rounded-lg transition-all duration-200 font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default BuildingDetails;

