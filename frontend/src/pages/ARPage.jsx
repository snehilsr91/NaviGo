import React from "react";
import ARScene from "../components/AR/ARScene";
import Navbar from "../components/Layout/Navbar";

const ARPage = () => {
  return (
    <div className="w-full h-screen flex flex-col relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70 pointer-events-none"
        style={{ backgroundImage: 'url(/unnamed.jpg)' }}
      ></div>
      {/* Gradient overlay - more transparent */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-purple-900/50 to-indigo-900/50 pointer-events-none"></div>
      <Navbar />
      <div className="flex-1 overflow-hidden relative z-10">
        <ARScene />
      </div>
    </div>
  );
};

export default ARPage;
