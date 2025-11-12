import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Layout/Navbar";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white overflow-hidden relative">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70"
        style={{ backgroundImage: "url(/unnamed.jpg)" }}
      ></div>
      {/* Gradient overlay - more transparent */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-purple-900/50 to-indigo-900/50"></div>

      <Navbar />

      <div className="relative z-10 pt-24 md:pt-20 h-full flex flex-col">
        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-5xl w-full">
            <div className="text-center mb-10 md:mb-12">
              <div className="inline-block mb-6">
                <h1 className="text-5xl sm:text-6xl md:text-8xl font-extrabold mb-4 bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent leading-tight">
                  Welcome to NaviGo
                </h1>
                <div className="h-1 md:h-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-500 rounded-full"></div>
              </div>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-10 md:mb-12 leading-relaxed">
                Explore your campus in augmented reality. Navigate with
                confidence using our innovative technology. Find teachers and
                buildings with ease.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 md:mb-12">
              <div
                onClick={() => navigate("/ar")}
                className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/40 hover:bg-white/25 hover:border-white/60 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-xl cursor-pointer active:scale-95 md:cursor-default md:active:scale-105"
              >
                <div className="text-3xl md:text-4xl mb-4">🎯</div>
                <h3 className="text-lg md:text-xl font-bold mb-2 text-cyan-300">
                  Navigation
                </h3>
                <p className="text-white text-sm">
                  Experience immersive navigation with real-time AR overlays,
                  location and object detection.
                </p>
              </div>
              <div
                onClick={() => navigate("/map")}
                className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/40 hover:bg-white/25 hover:border-white/60 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-xl cursor-pointer active:scale-95 md:cursor-default md:active:scale-105"
              >
                <div className="text-3xl md:text-4xl mb-4">🗺️</div>
                <h3 className="text-lg md:text-xl font-bold mb-2 text-purple-300">
                  Interactive Map
                </h3>
                <p className="text-white text-sm">
                  Explore campus buildings, get directions, and discover points
                  of interest.
                </p>
              </div>
              <div
                onClick={() => navigate("/ai-chat")}
                className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/40 hover:bg-white/25 hover:border-white/60 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-xl cursor-pointer active:scale-95 md:cursor-default md:active:scale-105"
              >
                <div className="text-3xl md:text-4xl mb-4">🤖</div>
                <h3 className="text-lg md:text-xl font-bold mb-2 text-indigo-300">
                  AI Assistant
                </h3>
                <p className="text-white text-sm">
                  Get instant answers about campus facilities, buildings, and
                  locations.
                </p>
              </div>
              <div
                onClick={() => navigate("/find-teacher")}
                className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/40 hover:bg-white/25 hover:border-white/60 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-xl cursor-pointer active:scale-95 md:cursor-default md:active:scale-105"
              >
                <div className="text-3xl md:text-4xl mb-4">👨‍🏫</div>
                <h3 className="text-lg md:text-xl font-bold mb-2 text-emerald-300">
                  Find Teacher
                </h3>
                <p className="text-white text-sm">
                  Locate your teachers instantly based on their current schedule
                  and location.
                </p>
              </div>
            </div>

            {/* Info Banner */}
            <div className="mt-8 flex justify-center text-center">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 sm:px-6 border border-white/10 inline-flex items-center gap-3">
                <span className="text-cyan-400 text-xl hidden sm:inline">
                  📹
                </span>
                <p className="text-gray-300 text-xs sm:text-sm">
                  Camera access will be requested when you start AR navigation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
