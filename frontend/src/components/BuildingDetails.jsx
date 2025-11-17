import React, { useState, useEffect, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { buildingReviewsApi } from "../services/api";

const BuildingDetails = ({
  building,
  onGetDirections,
  onGoToPlace,
  userLocation,
  locationError,
  onClose,
}) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [comment, setComment] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Touch drag state
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const loadData = useCallback(async () => {
    if (!building || building.id === "main-gate") {
      setLoading(false);
      setReviews([]);
      return;
    }

    try {
      setLoading(true);
      console.log(
        `🔄 Loading reviews for building: ${building.id} (${building.name})`
      );
      const reviewsData = await buildingReviewsApi.getReviews(building.id);
      console.log(
        `✅ Loaded ${reviewsData.length} reviews for ${building.name}`
      );
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (error) {
      console.error("❌ Error loading building data:", error);
      // Don't show error to user if it's just a 404 (no reviews yet)
      if (error.message && !error.message.includes("404")) {
        console.warn("⚠️ Could not load reviews:", error.message);
      }
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [building]);

  useEffect(() => {
    loadData();
    setIsExpanded(false); // Reset expansion state when building changes
  }, [loadData]);

  // Handle touch drag events
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    setTouchEnd(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50; // Minimum distance for swipe to register
    
    // Swipe up - expand
    if (distance > minSwipeDistance) {
      setIsExpanded(true);
    }
    // Swipe down - collapse
    else if (distance < -minSwipeDistance) {
      setIsExpanded(false);
    }
    
    setTouchStart(0);
    setTouchEnd(0);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Sanity check for excessively large files before processing
      if (file.size > 30 * 1024 * 1024) {
        // 30 MB
        alert("This file is very large. Please select a smaller image.");
        e.target.value = null; // Clear the file input
        setSelectedPhoto(null);
        return;
      }
      setSelectedPhoto(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() && !selectedPhoto) {
      alert("Please add a comment or a photo");
      return;
    }

    try {
      setSubmitting(true);
      let photoBase64 = null;

      if (selectedPhoto) {
        console.log(
          `Original image size: ${selectedPhoto.size / 1024 / 1024} MB`
        );
        const options = {
          maxSizeMB: 3, // Increased from 1MB to 3MB
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };

        const compressedFile = await imageCompression(selectedPhoto, options);
        console.log(
          `Compressed image size: ${compressedFile.size / 1024 / 1024} MB`
        );

        photoBase64 = await imageCompression.getDataUrlFromFile(compressedFile);
      }

      await buildingReviewsApi.addReview(building.id, comment, photoBase64);

      setComment("");
      setSelectedPhoto(null);
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

  // No special UI for main-gate needed anymore as it won't be selectable from the main map panel

  if (loading) {
    return (
      <div className="p-4 w-full h-full bg-black flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg text-gray-300">Loading Details...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        absolute bottom-0 left-0 right-0 md:static
        w-full h-full 
        bg-black/90 backdrop-blur-lg
        transition-all duration-500 ease-in-out
        flex flex-col
        ${
          isExpanded
            ? "translate-y-0"
            : "translate-y-[calc(100%-180px)] md:translate-y-0"
        }
      `}
    >
      {/* Mobile grabber and close button */}
      <div
        className="md:hidden p-4 text-center cursor-pointer touch-none select-none"
        onClick={() => setIsExpanded(!isExpanded)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-12 h-1.5 bg-gray-500 rounded-full mx-auto"></div>
        <p className="text-xs text-gray-400 mt-2">
          {isExpanded ? '⬇️ Swipe down' : '⬆️ Swipe up'}
        </p>
      </div>

      {/* Close button for desktop */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 border border-purple-500/30 hover:border-purple-500/50 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4 pr-8 sm:pr-10 bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">
          {building.name}
        </h3>

        {/* Action Buttons */}
        <div className="mb-3 sm:mb-4 space-y-2">
          {onGoToPlace && (
            <button
              onClick={() => onGoToPlace(building)}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 active:from-purple-500 active:to-purple-600 text-white text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg active:shadow-lg transition-all duration-200 font-bold active:scale-95 border border-purple-500/30 touch-manipulation min-h-[44px]"
            >
              📍 Go to Place
            </button>
          )}
          {onGetDirections && (
            <>
              {locationError ? (
                <div className="text-xs text-red-300 mb-2 p-2 bg-red-500/20 rounded-lg border border-red-400/30">
                  {locationError}
                </div>
              ) : userLocation ? (
                <button
                  onClick={() => onGetDirections(building)}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 active:from-purple-500 active:to-purple-600 text-white text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg active:shadow-lg transition-all duration-200 font-bold active:scale-95 border border-purple-500/30 touch-manipulation min-h-[44px]"
                >
                  🧭 Get Directions
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-600/50 text-gray-400 text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg cursor-not-allowed min-h-[44px]"
                >
                  Getting your location...
                </button>
              )}
            </>
          )}
        </div>

        {/* Comments Section */}
        <div className="mb-3 sm:mb-4">
          <h4 className="text-xs sm:text-sm font-bold text-purple-400 mb-2 sm:mb-3 flex items-center gap-2">
            <span>💬</span> Comments & Photos
          </h4>
          {reviews.length === 0 ? (
            <p className="text-xs text-gray-400 mb-2 bg-black/60 rounded-lg p-2 text-center border border-purple-500/20">
              None yet
            </p>
          ) : (
            <div className="space-y-2 mb-2">
              {reviews.map((review, idx) => (
                <div
                  key={idx}
                  className="bg-black/60 backdrop-blur-sm p-2.5 sm:p-3 rounded-lg text-xs text-gray-200 border border-purple-500/20"
                >
                  {review.comment && (
                    <p className="leading-relaxed">{review.comment}</p>
                  )}
                  {review.photo && (
                    <img
                      src={review.photo}
                      alt="Review photo"
                      className={`w-full h-20 sm:h-24 object-cover rounded-lg ${
                        review.comment ? "mt-2" : ""
                      } border border-purple-500/20`}
                    />
                  )}
                  <p className="text-gray-400 text-[10px] sm:text-xs mt-1.5 sm:mt-2">
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
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 active:from-purple-500 active:to-purple-600 text-white text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg active:shadow-lg transition-all duration-200 font-bold active:scale-95 border border-purple-500/30 touch-manipulation min-h-[44px]"
          >
            Add Comment or Photo
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment (optional)"
              className="w-full p-2.5 sm:p-3 bg-black/60 backdrop-blur-sm border border-purple-500/30 rounded-lg text-xs sm:text-sm resize-none text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 min-h-[80px]"
              rows="3"
            />
            <div>
              <label className="block text-xs text-purple-400 mb-1.5 sm:mb-2 font-semibold">
                Add a photo (optional, max 1MB)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="w-full text-xs text-gray-300 file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-purple-600 file:text-white active:file:bg-purple-500 file:border file:border-purple-500/30"
              />
              {selectedPhoto && (
                <p className="text-xs text-purple-400 mt-1.5 sm:mt-2 font-semibold">
                  {selectedPhoto.name} selected
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 active:from-purple-500 active:to-purple-600 text-white text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation min-h-[44px]"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setComment("");
                  setSelectedPhoto(null);
                }}
                className="flex-1 bg-black/60 active:bg-black/80 text-white text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 font-semibold border border-purple-500/30 active:border-purple-500/50 touch-manipulation min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BuildingDetails;
