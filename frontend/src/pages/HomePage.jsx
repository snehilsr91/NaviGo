import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Layout/Navbar";
import Carousel from "../components/UI/Carousel";

const HomePage = () => {
  const navigate = useNavigate();
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Purple accent shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Purple geometric shapes - squares */}
        <div className="absolute top-32 right-1/4 w-32 h-32 border border-purple-500/20 bg-transparent rotate-45" style={{ borderColor: 'rgba(168, 85, 247, 0.2)' }}></div>
        <div className="absolute bottom-32 left-1/3 w-24 h-24 border border-purple-500/15 bg-transparent rotate-35" style={{ borderColor: 'rgba(168, 85, 247, 0.15)' }}></div>
        <div className="absolute top-1/2 right-10 w-16 h-16 border border-purple-500/25 bg-transparent -rotate-12" style={{ borderColor: 'rgba(168, 85, 247, 0.25)' }}></div>
        <div className="absolute top-20 left-1/5 w-20 h-20 border border-purple-500/18 bg-transparent -rotate-25" style={{ borderColor: 'rgba(168, 85, 247, 0.18)' }}></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 border border-purple-500/22 bg-transparent -rotate-45" style={{ borderColor: 'rgba(168, 85, 247, 0.22)' }}></div>
        <div className="absolute top-2/3 left-1/2 w-16 h-16 border border-purple-500/20 bg-transparent rotate-60" style={{ borderColor: 'rgba(168, 85, 247, 0.2)' }}></div>
        <div className="absolute top-1/4 right-1/2 w-20 h-20 border border-purple-500/16 bg-transparent -rotate-30" style={{ borderColor: 'rgba(168, 85, 247, 0.16)' }}></div>
        <div className="absolute bottom-1/3 left-10 w-14 h-14 border border-purple-500/24 bg-transparent -rotate-40" style={{ borderColor: 'rgba(168, 85, 247, 0.24)' }}></div>
        <div className="absolute top-3/4 right-1/5 w-24 h-24 border border-purple-500/19 bg-transparent -rotate-20" style={{ borderColor: 'rgba(168, 85, 247, 0.19)' }}></div>
        <div className="absolute top-10 left-2/3 w-16 h-16 border border-purple-500/21 bg-transparent rotate-45" style={{ borderColor: 'rgba(168, 85, 247, 0.21)' }}></div>
        
        {/* Purple glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <Navbar />

      <div className="relative z-10 pt-24 sm:pt-28 md:pt-32 h-full flex flex-col">
        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
          <div className="max-w-6xl w-full">
            <div className="text-center mb-8 sm:mb-12 md:mb-16">
              <div className="inline-block mb-6 sm:mb-8">
                <h1 data-navigo-heading className="text-5xl sm:text-6xl md:text-7xl lg:text-9xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent leading-tight tracking-tight">
                  NAVIGO
                </h1>
                <div data-line-container className="relative" style={{ opacity: 0, visibility: 'hidden', display: 'block' }}>
                  <div className="h-0.5 sm:h-1 md:h-1.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full"></div>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 rounded-full -mt-1 animate-purple-pulse"></div>
                </div>
              </div>
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-300 max-w-4xl mx-auto mb-8 sm:mb-12 md:mb-16 leading-relaxed font-light px-2">
                Navigate your campus with <span className="text-purple-400 font-semibold">augmented reality</span>.
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                Find buildings, teachers, and facilities with ease.
              </p>
            </div>

            {/* Feature Cards - Carousel on mobile, grid on desktop */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
              <div
                onClick={() => navigate("/ar")}
                className="group relative bg-black/80 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="text-4xl md:text-5xl mb-4">🎯</div>
                  <div className="h-px w-12 bg-gradient-to-r from-purple-500 to-transparent mb-4"></div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 text-purple-400">
                    Detection & Navigation
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Experience immersive navigation with real-time AR overlays and object detection.
                  </p>
                </div>
              </div>
              
              <div
                onClick={() => navigate("/map")}
                className="group relative bg-black/80 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="text-4xl md:text-5xl mb-4">🗺️</div>
                  <div className="h-px w-12 bg-gradient-to-r from-purple-500 to-transparent mb-4"></div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 text-purple-400">
                    Interactive Map
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Explore campus buildings, get directions, and discover points of interest.
                  </p>
                </div>
              </div>
              
              <div
                onClick={() => navigate("/ai-chat")}
                className="group relative bg-black/80 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="text-4xl md:text-5xl mb-4">🤖</div>
                  <div className="h-px w-12 bg-gradient-to-r from-purple-500 to-transparent mb-4"></div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 text-purple-400">
                    AI Assistant
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Get instant answers about campus facilities, buildings, and locations.
                  </p>
                </div>
              </div>
              
              <div
                onClick={() => navigate("/find-teacher")}
                className="group relative bg-black/80 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="text-4xl md:text-5xl mb-4">👨‍🏫</div>
                  <div className="h-px w-12 bg-gradient-to-r from-purple-500 to-transparent mb-4"></div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 text-purple-400">
                    Find Teacher
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Locate your teachers instantly based on their current schedule and location.
                  </p>
                </div>
              </div>
              
              <div
                onClick={() => navigate("/events")}
                className="group relative bg-black/80 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="text-4xl md:text-5xl mb-4">📅</div>
                  <div className="h-px w-12 bg-gradient-to-r from-purple-500 to-transparent mb-4"></div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 text-purple-400">
                    Campus Events
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Discover ongoing and upcoming events, register, and book auditoriums.
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Features Section */}
            <div className="md:hidden mb-8">
              {/* Carousel */}
              <div className="mb-6">
                <Carousel autoPlay={true} autoPlayInterval={3500}>
                  <div
                    onClick={() => navigate("/ar")}
                    className="group relative bg-black/80 backdrop-blur-sm rounded-2xl p-6 sm:p-7 border border-purple-500/30 active:border-purple-500/60 transition-all duration-300 cursor-pointer touch-manipulation h-full min-h-[200px] flex flex-col justify-between"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-active:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="text-4xl sm:text-5xl mb-4">🎯</div>
                      <div className="h-px w-12 bg-gradient-to-r from-purple-500 to-transparent mb-4"></div>
                      <h3 className="text-xl sm:text-2xl font-bold mb-3 text-purple-400">
                        Detection & Navigation
                      </h3>
                      <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                        Experience immersive navigation with real-time AR overlays and object detection.
                      </p>
                    </div>
                  </div>
                  
                  <div
                    onClick={() => navigate("/map")}
                    className="group relative bg-black/80 backdrop-blur-sm rounded-2xl p-6 sm:p-7 border border-purple-500/30 active:border-purple-500/60 transition-all duration-300 cursor-pointer touch-manipulation h-full min-h-[200px] flex flex-col justify-between"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-active:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="text-4xl sm:text-5xl mb-4">🗺️</div>
                      <div className="h-px w-12 bg-gradient-to-r from-purple-500 to-transparent mb-4"></div>
                      <h3 className="text-xl sm:text-2xl font-bold mb-3 text-purple-400">
                        Interactive Map
                      </h3>
                      <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                        Explore campus buildings, get directions, and discover points of interest.
                      </p>
                    </div>
                  </div>
                  
                  <div
                    onClick={() => navigate("/ai-chat")}
                    className="group relative bg-black/80 backdrop-blur-sm rounded-2xl p-6 sm:p-7 border border-purple-500/30 active:border-purple-500/60 transition-all duration-300 cursor-pointer touch-manipulation h-full min-h-[200px] flex flex-col justify-between"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-active:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="text-4xl sm:text-5xl mb-4">🤖</div>
                      <div className="h-px w-12 bg-gradient-to-r from-purple-500 to-transparent mb-4"></div>
                      <h3 className="text-xl sm:text-2xl font-bold mb-3 text-purple-400">
                        AI Assistant
                      </h3>
                      <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                        Get instant answers about campus facilities, buildings, and locations.
                      </p>
                    </div>
                  </div>
                  
                  <div
                    onClick={() => navigate("/find-teacher")}
                    className="group relative bg-black/80 backdrop-blur-sm rounded-2xl p-6 sm:p-7 border border-purple-500/30 active:border-purple-500/60 transition-all duration-300 cursor-pointer touch-manipulation h-full min-h-[200px] flex flex-col justify-between"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-active:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="text-4xl sm:text-5xl mb-4">👨‍🏫</div>
                      <div className="h-px w-12 bg-gradient-to-r from-purple-500 to-transparent mb-4"></div>
                      <h3 className="text-xl sm:text-2xl font-bold mb-3 text-purple-400">
                        Find Teacher
                      </h3>
                      <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                        Locate your teachers instantly based on their current schedule and location.
                      </p>
                    </div>
                  </div>
                  
                  <div
                    onClick={() => navigate("/events")}
                    className="group relative bg-black/80 backdrop-blur-sm rounded-2xl p-6 sm:p-7 border border-purple-500/30 active:border-purple-500/60 transition-all duration-300 cursor-pointer touch-manipulation h-full min-h-[200px] flex flex-col justify-between"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-active:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className="text-4xl sm:text-5xl mb-4">📅</div>
                      <div className="h-px w-12 bg-gradient-to-r from-purple-500 to-transparent mb-4"></div>
                      <h3 className="text-xl sm:text-2xl font-bold mb-3 text-purple-400">
                        Campus Events
                      </h3>
                      <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                        Discover ongoing and upcoming events, register, and book auditoriums.
                      </p>
                    </div>
                  </div>
                </Carousel>
              </div>

              {/* View All Features Button */}
              <div className="text-center">
                <button
                  onClick={() => setShowAllFeatures(!showAllFeatures)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-black/60 backdrop-blur-sm border border-purple-500/30 rounded-xl text-purple-400 hover:text-purple-300 active:border-purple-500/50 transition-all duration-200 text-sm font-semibold touch-manipulation"
                >
                  <span>{showAllFeatures ? "Hide" : "View"} All Features</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${showAllFeatures ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* All Features Grid (Expandable) */}
              {showAllFeatures && (
                <div className="mt-6 grid grid-cols-2 gap-3 animate-fade-in">
                  <div
                    onClick={() => navigate("/ar")}
                    className="bg-black/80 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30 active:border-purple-500/50 transition-all duration-200 cursor-pointer touch-manipulation"
                  >
                    <div className="text-2xl mb-2">🎯</div>
                    <h4 className="text-sm font-bold text-purple-400 mb-1">Detection & Navigation</h4>
                    <p className="text-xs text-gray-400 leading-tight">Immersive detection & navigation</p>
                  </div>
                  
                  <div
                    onClick={() => navigate("/map")}
                    className="bg-black/80 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30 active:border-purple-500/50 transition-all duration-200 cursor-pointer touch-manipulation"
                  >
                    <div className="text-2xl mb-2">🗺️</div>
                    <h4 className="text-sm font-bold text-purple-400 mb-1">Interactive Map</h4>
                    <p className="text-xs text-gray-400 leading-tight">Explore campus buildings</p>
                  </div>
                  
                  <div
                    onClick={() => navigate("/ai-chat")}
                    className="bg-black/80 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30 active:border-purple-500/50 transition-all duration-200 cursor-pointer touch-manipulation"
                  >
                    <div className="text-2xl mb-2">🤖</div>
                    <h4 className="text-sm font-bold text-purple-400 mb-1">AI Assistant</h4>
                    <p className="text-xs text-gray-400 leading-tight">Get instant answers</p>
                  </div>
                  
                  <div
                    onClick={() => navigate("/find-teacher")}
                    className="bg-black/80 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30 active:border-purple-500/50 transition-all duration-200 cursor-pointer touch-manipulation"
                  >
                    <div className="text-2xl mb-2">👨‍🏫</div>
                    <h4 className="text-sm font-bold text-purple-400 mb-1">Find Teacher</h4>
                    <p className="text-xs text-gray-400 leading-tight">Locate teachers instantly</p>
                  </div>
                  
                  <div
                    onClick={() => navigate("/events")}
                    className="bg-black/80 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30 active:border-purple-500/50 transition-all duration-200 cursor-pointer touch-manipulation col-span-2"
                  >
                    <div className="text-2xl mb-2">📅</div>
                    <h4 className="text-sm font-bold text-purple-400 mb-1">Campus Events</h4>
                    <p className="text-xs text-gray-400 leading-tight">Discover and register for events</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
