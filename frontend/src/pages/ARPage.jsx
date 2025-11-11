import React from "react";
import ARScene from "../components/AR/ARScene";
import Navbar from "../components/Layout/Navbar";

const ARPage = () => {
  return (
    <div className="w-full h-screen flex flex-col relative">
      {/* Background Image with reduced opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 pointer-events-none"
        style={{ backgroundImage: 'url(/unnamed.jpg)' }}
      ></div>
      <Navbar />
      <div className="flex-1 overflow-hidden relative z-10">
        <ARScene />
      </div>
    </div>
  );
};

export default ARPage;
