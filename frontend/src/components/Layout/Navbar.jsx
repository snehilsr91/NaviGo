import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="w-full bg-white shadow-md px-6 py-4 flex justify-between items-center fixed top-0 z-50">
      <Link to="/" className="text-2xl font-bold text-purple-700">
        NaviGo
      </Link>
      <div className="space-x-4">
        <Link
          to="/"
          className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
        >
          Home
        </Link>
        <Link
          to="/ar"
          className="text-white bg-orange-500 hover:bg-orange-400 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Start AR
        </Link>
        <Link
          to="/map"
          className="text-purple-700 hover:text-purple-900 font-medium transition-colors"
        >
          Map
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
