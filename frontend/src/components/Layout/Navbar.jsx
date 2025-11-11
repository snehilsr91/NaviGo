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
  ];

  return (
    <PillNav
      logo={logo}
      logoAlt="NaviGo Logo"
      items={navItems}
      activeHref={location.pathname}
      className="navi-go-navbar"
      ease="power2.out"
      baseColor="transparent"
      pillColor="#ffffff"
      hoveredPillTextColor="#ffffff"
      pillTextColor="#7c3aed"
      initialLoadAnimation={true}
    />
  );
};

export default Navbar;
