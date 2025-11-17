import React from "react";
import ARScene from "../components/AR/ARScene";
import Navbar from "../components/Layout/Navbar";

const ARPage = () => {
  return (
    <div className="w-full h-screen flex flex-col relative bg-black">
      <Navbar />
      <div className="flex-1 overflow-hidden relative z-10">
        <ARScene />
      </div>
    </div>
  );
};

export default ARPage;
