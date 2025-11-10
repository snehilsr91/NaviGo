import React, { useState, useEffect, useCallback } from "react";
import { buildingReviewsApi } from "../services/api";

// Get base URL for static file serving (uploads are served directly, not through /api)
const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  // Remove /api suffix if present to get base URL
  return apiUrl.replace(/\/api$/, "");
};

const API_URL = getBaseUrl();

const BuildingDetails = ({ building }) => {
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
      <div className="p-3 max-w-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{building.name}</h3>
        <p className="text-sm text-gray-600">Reviews and photos are not available for the main gate.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-3 max-w-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{building.name}</h3>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-3 max-w-sm w-80 max-h-[500px] overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">{building.name}</h3>

      {/* Photos Section */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Photos</h4>
        {photos.length === 0 ? (
          <p className="text-xs text-gray-500 mb-2">None yet</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-2">
            {photos.map((photo, idx) => (
              <img
                key={idx}
                src={`${API_URL}${photo.url}`}
                alt={`Building photo ${idx + 1}`}
                className="w-full h-24 object-cover rounded"
              />
            ))}
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Comments</h4>
        {reviews.filter((r) => r.comment && r.comment.trim()).length === 0 ? (
          <p className="text-xs text-gray-500 mb-2">None yet</p>
        ) : (
          <div className="space-y-2 mb-2">
            {reviews
              .filter((r) => r.comment && r.comment.trim())
              .map((review, idx) => (
                <div key={idx} className="bg-gray-50 p-2 rounded text-xs text-gray-700">
                  <p>{review.comment}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add Review Form */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full bg-blue-500 text-white text-sm py-2 px-3 rounded hover:bg-blue-600 transition"
        >
          Add Comment or Photo
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (optional)"
            className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
            rows="3"
          />
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Add photos (up to 5)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              className="w-full text-xs"
            />
            {selectedPhotos.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {selectedPhotos.length} photo(s) selected
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-500 text-white text-sm py-2 px-3 rounded hover:bg-blue-600 transition disabled:opacity-50"
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
              className="flex-1 bg-gray-300 text-gray-700 text-sm py-2 px-3 rounded hover:bg-gray-400 transition"
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

