import { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../services/api';

function ReviewModeration() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [sortBy, setSortBy] = useState('time-desc'); // time-desc, time-asc, alphabetical
  const [filterBuilding, setFilterBuilding] = useState('all');

  useEffect(() => {
    loadAllData();
  }, []);

  // Normalize building name - convert spaces to hyphens and lowercase for consistency
  const normalizeBuildingName = (name) => {
    if (!name) return '';
    return name.toLowerCase().replace(/\s+/g, '-');
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load only reviews from database (exclude file-based photos)
      const reviewsData = await adminApi.getReviews().catch(() => []);

      // Only use database reviews, not file-based photos
      setReviews(reviewsData);
    } catch (err) {
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      setDeleting(id);
      // Delete review from database
      await adminApi.deleteReview(id);
      await loadAllData();
      alert('✅ Deleted successfully!');
    } catch (err) {
      alert(`❌ Failed to delete: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get unique buildings for filter (using normalized format: lowercase with hyphens)
  // Only include buildings from database reviews, not file-based photos
  const uniqueBuildings = useMemo(() => {
    const buildingsSet = new Set();
    
    reviews.forEach(r => {
      // Only include database reviews (exclude file-based photos)
      if (r.buildingId && !r.photoType) {
        // Always normalize to lowercase with hyphens format
        const normalized = normalizeBuildingName(r.buildingId);
        buildingsSet.add(normalized);
      }
    });
    
    return Array.from(buildingsSet).sort();
  }, [reviews]);

  // Filter and sort items (only database reviews, no file-based photos)
  const filteredAndSortedItems = useMemo(() => {
    // Only include database reviews, exclude file-based photos
    let items = reviews.filter(item => !item.photoType);

    // Filter by building (normalize comparison to handle variations)
    if (filterBuilding !== 'all') {
      const normalizedFilter = normalizeBuildingName(filterBuilding);
      items = items.filter(item => {
        const normalizedItem = normalizeBuildingName(item.buildingId);
        return normalizedItem === normalizedFilter;
      });
    }

    // Sort items
    items.sort((a, b) => {
      switch (sortBy) {
        case 'time-desc':
          // Latest first (newest at top), items without dates go to end
          if (!a.createdAt && !b.createdAt) return 0;
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        
        case 'time-asc':
          // Oldest first
          if (!a.createdAt && !b.createdAt) return 0;
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(a.createdAt) - new Date(b.createdAt);
        
        case 'alphabetical':
          // Sort by building name, then by comment/filename
          const buildingCompare = a.buildingId.localeCompare(b.buildingId);
          if (buildingCompare !== 0) return buildingCompare;
          
          // If same building, sort by comment or filename
          const aText = a.comment || a.filename || '';
          const bText = b.comment || b.filename || '';
          return aText.localeCompare(bText);
        
        default:
          return 0;
      }
    });

    return items;
  }, [reviews, sortBy, filterBuilding]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Determine image source - handle both Base64 and URL paths
  const getImageSrc = (review) => {
    if (!review.photo) return null;
    
    // If it's a Base64 string (starts with data:image), return directly
    if (review.photo.startsWith('data:image')) {
      return review.photo;
    }
    
    // If it's a file-based photo, use the URL path
    if (review.photoType === 'file') {
      return `${API_URL}${review.photo}`;
    }
    
    // For regular review photos stored as Base64, return directly
    // If it looks like a URL path, prepend API_URL
    if (review.photo.startsWith('/')) {
      return `${API_URL}${review.photo}`;
    }
    
    // Otherwise assume it's Base64
    return review.photo;
  };

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-purple-400 mb-2">Review Moderation</h1>
        <p className="text-sm sm:text-base text-gray-300">Moderate reviews for campus buildings</p>
      </div>

      {/* Filters and Sorting */}
      <div className="bg-black/80 backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-purple-500/30 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Filter by Building */}
          <div>
            <label className="block text-sm font-semibold text-purple-400 mb-2">
              Filter by Building
            </label>
            <select
              value={filterBuilding}
              onChange={(e) => setFilterBuilding(e.target.value)}
              className="w-full px-4 py-2 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
            >
               <option value="all">All Buildings ({reviews.length})</option>
               {uniqueBuildings.map((building) => {
                 // Count only database reviews (no file-based photos)
                 const count = reviews.filter(r => {
                   // Only count actual reviews from database (no photoType field means it's a DB review)
                   if (r.photoType === 'file') return false;
                   const normalizedItem = normalizeBuildingName(r.buildingId);
                   return normalizedItem === building;
                 }).length;
                 return (
                   <option key={building} value={building}>
                     {building} ({count})
                   </option>
                 );
               })}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-semibold text-purple-400 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
            >
              <option value="time-desc">Latest First</option>
              <option value="time-asc">Oldest First</option>
              <option value="alphabetical">Alphabetical (Building)</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 mb-6">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-4 text-sm sm:text-base text-gray-300">Loading...</p>
        </div>
      ) : filteredAndSortedItems.length === 0 ? (
        <div className="bg-black/60 border border-purple-500/20 rounded-xl p-6 sm:p-8 text-center">
          <p className="text-gray-400 text-base sm:text-lg">
             {filterBuilding !== 'all' 
               ? `No reviews found for ${filterBuilding}` 
               : 'No reviews found'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {filteredAndSortedItems.map((item) => {
            const imageSrc = getImageSrc(item);
            
            return (
              <div
                key={item._id}
                className="bg-black/80 backdrop-blur-xl rounded-xl p-4 sm:p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300"
              >
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                   <span className="text-sm font-semibold text-purple-400 break-words">{item.buildingId}</span>
                   <span className="text-xs text-gray-400">{formatDate(item.createdAt)}</span>
                 </div>

                {item.comment && (
                  <p className="text-white text-sm sm:text-base mb-4 break-words">{item.comment}</p>
                )}

                {imageSrc && (
                  <div className="mb-4">
                    <img
                      src={imageSrc}
                      alt={item.comment || item.filename || 'Review photo'}
                      className="w-full h-40 sm:h-48 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23333" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not available%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                )}

                 {item.author && (
                   <p className="text-xs sm:text-sm text-gray-400 mb-4 break-words">By: {item.author}</p>
                 )}

                 <button
                   onClick={() => handleDeleteReview(item._id)}
                   disabled={deleting === item._id}
                   className="w-full px-4 py-2 text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {deleting === item._id ? 'Deleting...' : 'Delete Review'}
                 </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ReviewModeration;
