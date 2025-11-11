import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Layout/Navbar";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white overflow-hidden relative">
      {/* Background Image with reduced opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
        style={{ backgroundImage: 'url(/unnamed.jpg)' }}
      ></div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/80 to-indigo-900/80"></div>
      
      <Navbar />

      <div className="relative z-10 pt-20 h-screen flex flex-col">
        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-5xl w-full">
            <div className="text-center mb-12">
              <div className="inline-block mb-6">
                <h1 className="text-6xl sm:text-7xl md:text-8xl font-extrabold mb-4 bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent leading-tight">
                  Welcome to NaviGo
                </h1>
                <div className="h-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-500 rounded-full"></div>
              </div>
              <p className="text-xl sm:text-2xl text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed">
                Explore your campus in augmented reality. Navigate with confidence using our innovative AR technology.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-bold mb-2 text-cyan-300">AR Navigation</h3>
                <p className="text-gray-300 text-sm">Experience immersive navigation with real-time AR overlays and object detection.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                <div className="text-4xl mb-4">🗺️</div>
                <h3 className="text-xl font-bold mb-2 text-purple-300">Interactive Map</h3>
                <p className="text-gray-300 text-sm">Explore campus buildings, get directions, and discover points of interest.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-xl font-bold mb-2 text-indigo-300">AI Assistant</h3>
                <p className="text-gray-300 text-sm">Get instant answers about campus facilities, buildings, and locations.</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate("/ar")}
                className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-orange-500/50 min-w-[200px]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-xl">🚀</span>
                  <span>Start AR Navigation</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
              <button
                onClick={() => navigate("/map")}
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-purple-500/50 min-w-[200px]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-xl">🗺️</span>
                  <span>View Map</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
              <button
                onClick={() => navigate("/ai-chat")}
                className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-cyan-500/50 min-w-[200px]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-xl">🤖</span>
                  <span>AI Assistant</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>

            {/* Info Banner */}
            <div className="mt-8 flex justify-center">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/10 inline-flex items-center gap-3">
                <span className="text-cyan-400 text-xl">📹</span>
                <p className="text-gray-300 text-sm">
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
