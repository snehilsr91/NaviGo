import React from "react";
import { useLocation } from "react-router-dom";
import PillNav from "./PillNav";

const Navbar = () => {
  const location = useLocation();
  const logo = "/Gemini_Generated_Image_lk7w0olk7w0olk7w.png";

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Map", href: "/map" },
    { label: "Start AR", href: "/ar" },
    { label: "AI Assistant", href: "/ai-chat" },
    { label: "Find", href: "/find-teacher" },
    { label: "Events", href: "/events" },
  ];

  const isMapPage = location.pathname === "/map";

  return (
    <PillNav
      logo={logo}
      logoAlt="NaviGo Logo"
      items={navItems}
      activeHref={location.pathname}
      className={`navi-go-navbar ${isMapPage ? "map-page-navbar" : ""}`}
      ease="power2.out"
      baseColor="#8b5cf6"
      pillColor="#000000"
      hoveredPillTextColor="#ffffff"
      pillTextColor="#a78bfa"
      initialLoadAnimation={true}
      isMapPage={isMapPage}
    />
  );
};

export default Navbar;
