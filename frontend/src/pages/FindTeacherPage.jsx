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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white overflow-hidden relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70"
        style={{ backgroundImage: 'url(/unnamed.jpg)' }}
      ></div>
      {/* Gradient overlay - more transparent */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-purple-900/50 to-indigo-900/50"></div>
      
      <Navbar />

      <div className="relative z-10 pt-16 sm:pt-20 md:pt-28 px-4 pb-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6 md:mb-8">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-2 sm:mb-3 md:mb-4 transition-colors text-sm sm:text-base"
            >
              <span>←</span>
              <span>Back to Home</span>
            </button>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-2 sm:mb-3 md:mb-4 bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">
              Find Your Teacher
            </h1>
            <p className="text-base sm:text-lg text-gray-300 mb-1 sm:mb-2">
              Search for a teacher to find their current location
            </p>
            <p className="text-xs sm:text-sm text-gray-400">
              Current Time: {getCurrentTime()}
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 sm:p-5 md:p-8 border-2 border-white/40 mb-6 relative shadow-xl">
            <form onSubmit={handleSearch} className="space-y-3 sm:space-y-4">
              <div className="relative">
                <label htmlFor="teacher-search" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
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
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50 transition-all text-sm sm:text-base"
                  disabled={loading}
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && filteredTeachers.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-slate-800/95 backdrop-blur-xl border-2 border-white/40 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {filteredTeachers.slice(0, 10).map((teacher, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(teacher)}
                        className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0"
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
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
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
            <div className="bg-red-500/20 backdrop-blur-lg border-2 border-red-500/60 rounded-xl p-4 mb-6 animate-fade-in shadow-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-bold text-red-300">Error</h3>
                  <p className="text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Result Card */}
          {result && result.success && (
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 md:p-8 border-2 border-white/40 animate-fade-in shadow-xl">
              <div className="text-center mb-6">
                <div className="inline-block p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-4">
                  <span className="text-4xl">📍</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-cyan-300">
                  {result.teacher}
                </h2>
                <div className="inline-block px-4 py-1 bg-white/10 rounded-full text-sm text-gray-300">
                  {result.source === "timetable" ? "From Timetable" : "Usual Location"}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white/10 rounded-xl p-4 border-2 border-white/30">
                  <p className="text-gray-400 text-sm mb-1">Location</p>
                  <p className="text-xl md:text-2xl font-bold text-white">{result.location}</p>
                </div>

                {result.currentDay && result.currentTimeSlot && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 border-2 border-white/30">
                      <p className="text-gray-400 text-sm mb-1">Day</p>
                      <p className="text-lg font-semibold text-purple-300">{result.currentDay}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 border-2 border-white/30">
                      <p className="text-gray-400 text-sm mb-1">Time Slot</p>
                      <p className="text-lg font-semibold text-purple-300">{result.currentTimeSlot}</p>
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl p-4 border-2 border-cyan-500/50">
                  <p className="text-cyan-200 text-center">{result.message}</p>
                </div>
              </div>

              {/* Search Again Button */}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setResult(null);
                  setError("");
                }}
                className="w-full mt-6 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 border-2 border-white/40"
              >
                Search Another Teacher
              </button>
            </div>
          )}

          {/* Info Section */}
          {!result && !error && !loading && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border-2 border-white/30">
              <div className="flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div className="text-sm text-gray-300">
                  <p className="font-semibold mb-2">How it works:</p>
                  <ul className="space-y-1 list-disc list-inside">
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

