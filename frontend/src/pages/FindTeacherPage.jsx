import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { teacherLocationApi } from "../services/api";
import Navbar from "../components/Layout/Navbar";

const FindTeacherPage = () => {
  const navigate = useNavigate();
  const [teacherName, setTeacherName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [teachersList, setTeachersList] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredTeachers, setFilteredTeachers] = useState([]);

  // Load teachers list on mount
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const response = await teacherLocationApi.getAllTeachers();
        if (response.success && response.teachers) {
          setTeachersList(response.teachers);
        }
      } catch (err) {
        console.error("Failed to load teachers list:", err);
      }
    };
    loadTeachers();
  }, []);

  // Filter teachers based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTeachers([]);
      setShowSuggestions(false);
    } else {
      const filtered = teachersList.filter((teacher) =>
        teacher.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTeachers(filtered);
      setShowSuggestions(filtered.length > 0);
    }
  }, [searchQuery, teachersList]);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError("Please enter a teacher's name");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setShowSuggestions(false);

    try {
      const data = await teacherLocationApi.findTeacher(searchQuery);
      setResult(data);
      setTeacherName(searchQuery);
    } catch (err) {
      setError(err.message || "Failed to find teacher");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (teacher) => {
    setSearchQuery(teacher);
    setShowSuggestions(false);
    // Trigger search immediately
    setTimeout(() => {
      document.getElementById("search-button")?.click();
    }, 100);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Purple accent lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
        <div className="absolute top-60 left-10 w-px h-64 bg-gradient-to-b from-purple-500/20 to-transparent"></div>
        <div className="absolute bottom-40 right-20 w-px h-80 bg-gradient-to-t from-purple-500/20 to-transparent"></div>
        <div className="absolute top-1/3 right-1/4 w-32 h-32 border border-purple-500/15 rotate-45"></div>
      </div>
      
      <Navbar />

      <div className="relative z-10 pt-20 sm:pt-24 md:pt-28 px-4 sm:px-6 pb-8 sm:pb-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-purple-400 active:text-purple-300 mb-3 sm:mb-4 transition-colors text-xs sm:text-sm touch-manipulation"
            >
              <span>←</span>
              <span>Back to Home</span>
            </button>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-2 sm:mb-3 md:mb-4 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent px-2">
              Find Your Teacher
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-2 sm:mb-3 px-2">
              Search for a teacher to find their current location
            </p>
            <p className="text-xs sm:text-sm text-gray-400 px-2">
              Current Time: {getCurrentTime()}
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-black/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-8 border border-purple-500/30 mb-4 sm:mb-6 relative shadow-xl active:border-purple-500/50 transition-colors">
            <form onSubmit={handleSearch} className="space-y-3 sm:space-y-4">
              <div className="relative">
                <label htmlFor="teacher-search" className="block text-xs sm:text-sm font-semibold text-purple-400 mb-2">
                  Teacher Name
                </label>
                <input
                  id="teacher-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (filteredTeachers.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="e.g., Dr. John Smith"
                  className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-black/60 border border-purple-500/30 rounded-lg sm:rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 transition-all text-sm sm:text-base min-h-[44px]"
                  disabled={loading}
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && filteredTeachers.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-black/95 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {filteredTeachers.slice(0, 10).map((teacher, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(teacher)}
                        className="w-full px-4 py-3 text-left hover:bg-purple-500/10 transition-colors border-b border-purple-500/10 last:border-b-0"
                      >
                        <span className="text-white">{teacher}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                id="search-button"
                type="submit"
                disabled={loading}
                className="w-full px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 active:from-purple-500 active:to-purple-600 text-white font-bold rounded-lg sm:rounded-xl shadow-lg transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-manipulation min-h-[48px]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Searching...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>🔍</span>
                    <span>Find Teacher</span>
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 backdrop-blur-lg border border-red-500/40 rounded-xl p-4 mb-6 animate-fade-in shadow-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-bold text-red-400">Error</h3>
                  <p className="text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Result Card */}
          {result && result.success && (
            <div className="bg-black/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 border border-purple-500/30 animate-fade-in shadow-xl">
              <div className="text-center mb-5 sm:mb-6">
                <div className="inline-block p-3 sm:p-4 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-full mb-3 sm:mb-4 border border-purple-500/30">
                  <span className="text-3xl sm:text-4xl">📍</span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-purple-400 px-2">
                  {result.teacher}
                </h2>
                <div className="inline-block px-3 sm:px-4 py-1 bg-black/60 rounded-full text-xs sm:text-sm text-gray-300 border border-purple-500/20">
                  {result.source === "timetable" ? "From Timetable" : "Usual Location"}
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="bg-black/60 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-500/20">
                  <p className="text-gray-400 text-xs sm:text-sm mb-1">Location</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">{result.location}</p>
                </div>

                {result.currentDay && result.currentTimeSlot && (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-black/60 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-500/20">
                      <p className="text-gray-400 text-xs sm:text-sm mb-1">Day</p>
                      <p className="text-base sm:text-lg font-semibold text-purple-400">{result.currentDay}</p>
                    </div>
                    <div className="bg-black/60 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-500/20">
                      <p className="text-gray-400 text-xs sm:text-sm mb-1">Time Slot</p>
                      <p className="text-base sm:text-lg font-semibold text-purple-400">{result.currentTimeSlot}</p>
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-500/30">
                  <p className="text-purple-300 text-center text-sm sm:text-base leading-relaxed">{result.message}</p>
                </div>
              </div>

              {/* Search Again Button */}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setResult(null);
                  setError("");
                }}
                className="w-full mt-5 sm:mt-6 px-4 sm:px-6 py-3 bg-black/60 active:bg-black/80 text-white font-semibold rounded-lg sm:rounded-xl transition-all duration-300 border border-purple-500/30 active:border-purple-500/50 touch-manipulation min-h-[44px]"
              >
                Search Another Teacher
              </button>
            </div>
          )}

          {/* Info Section */}
          {!result && !error && !loading && (
            <div className="bg-black/60 backdrop-blur-lg rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-500/20">
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-lg sm:text-xl text-purple-400 flex-shrink-0">💡</span>
                <div className="text-xs sm:text-sm text-gray-300">
                  <p className="font-semibold mb-1.5 sm:mb-2 text-purple-300">How it works:</p>
                  <ul className="space-y-1 list-disc list-inside text-gray-400 leading-relaxed">
                    <li>Enter a teacher's name to search</li>
                    <li>If the teacher has a class now, you'll see their current location from the timetable</li>
                    <li>Otherwise, you'll see their usual location (office/department)</li>
                    <li>Use the suggestions dropdown for quick selection</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindTeacherPage;

