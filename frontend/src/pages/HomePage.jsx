import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Layout/Navbar";

const HomePage = () => {
  const navigate = useNavigate();

  const handleStartAR = () => {
    navigate("/ar");
  };

  const handleViewMap = () => {
    navigate("/map");
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <div className="flex flex-col items-center justify-center pt-28 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-purple-700 mb-4">
          Welcome to <span className="text-orange-500">NaviGo</span>
        </h1>
        <p className="text-gray-600 mb-10 max-w-lg">
          Explore your campus in augmented reality. Tap the button below to
          start AR navigation or view the map.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleStartAR}
            className="px-8 py-4 bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded-lg shadow-md transition-all duration-200"
          >
            Start AR Navigation
          </button>
          <button
            onClick={handleViewMap}
            className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-lg shadow-md transition-all duration-200"
          >
            View Map
          </button>
          <button
            onClick={() => navigate("/ai-chat")}
            className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg shadow-md transition-all duration-200"
          >
            AI Assistant
          </button>
        </div>

        <div className="mt-12 text-gray-500 text-sm max-w-md">
          Camera access is required for AR navigation. Permission will be
          requested when you start AR.
        </div>
      </div>
    </div>
  );
};

export default HomePage;
