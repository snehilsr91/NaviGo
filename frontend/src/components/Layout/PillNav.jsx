import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";

const PillNav = ({
  logo,
  logoAlt = "Logo",
  items,
  activeHref,
  className = "",
  ease = "power3.easeOut",
  baseColor = "#fff",
  pillColor = "#060010",
  hoveredPillTextColor = "#060010",
  pillTextColor,
  onMobileMenuClick,
  initialLoadAnimation = true,
  isMapPage = false,
}) => {
  const resolvedPillTextColor = pillTextColor ?? baseColor;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const circleRefs = useRef([]);
  const tlRefs = useRef([]);
  const activeTweenRefs = useRef([]);
  const logoImgRef = useRef(null);
  const logoTweenRef = useRef(null);
  const hamburgerRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navItemsRef = useRef(null);
  const logoRef = useRef(null);

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle) => {
        if (!circle?.parentElement) return;

        const pill = circle.parentElement;
        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta =
          Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`,
        });

        const label = pill.querySelector(".pill-label");
        const white = pill.querySelector(".pill-label-hover");

        if (label) gsap.set(label, { y: 0 });
        if (white) gsap.set(white, { y: h + 12, opacity: 0 });

        const index = circleRefs.current.indexOf(circle);
        if (index === -1) return;

        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });

        tl.to(
          circle,
          { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: "auto" },
          0
        );

        if (label) {
          tl.to(
            label,
            { y: -(h + 8), duration: 2, ease, overwrite: "auto" },
            0
          );
        }

        if (white) {
          gsap.set(white, { y: Math.ceil(h + 100), opacity: 0 });
          tl.to(
            white,
            { y: 0, opacity: 1, duration: 2, ease, overwrite: "auto" },
            0
          );
        }

        tlRefs.current[index] = tl;
      });
    };

    layout();

    const onResize = () => layout();
    window.addEventListener("resize", onResize);

    if (document.fonts?.ready) {
      document.fonts.ready.then(layout).catch(() => {});
    }

    const menu = mobileMenuRef.current;
    if (menu) {
      gsap.set(menu, { visibility: "hidden", opacity: 0, scaleY: 1, y: 0 });
    }

    // Hamburger lines are now controlled by CSS based on isMobileMenuOpen state

    if (initialLoadAnimation) {
      const logo = logoRef.current;
      const navItems = navItemsRef.current;

      if (logo) {
        gsap.set(logo, { scale: 0 });
        gsap.to(logo, {
          scale: 1,
          duration: 0.6,
          ease,
        });
      }

      if (navItems) {
        gsap.set(navItems, { width: 0, overflow: "hidden" });
        gsap.to(navItems, {
          width: "auto",
          duration: 0.6,
          ease,
        });
      }
    }

    return () => window.removeEventListener("resize", onResize);
  }, [items, ease, initialLoadAnimation]);

  const handleEnter = (i) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.3,
      ease,
      overwrite: "auto",
    });
  };

  const handleLeave = (i) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.2,
      ease,
      overwrite: "auto",
    });
  };

  const handleLogoEnter = () => {
    const img = logoImgRef.current;
    if (!img) return;
    logoTweenRef.current?.kill();
    gsap.set(img, { rotate: 0 });
    logoTweenRef.current = gsap.to(img, {
      rotate: 360,
      duration: 0.2,
      ease,
      overwrite: "auto",
    });
  };

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);

    const hamburger = hamburgerRef.current;
    const menu = mobileMenuRef.current;

    // Animation is now handled by CSS transitions based on isMobileMenuOpen state
    // No GSAP animation needed for hamburger lines

    if (menu) {
      if (newState) {
        gsap.set(menu, { visibility: "visible" });
        gsap.fromTo(
          menu,
          { opacity: 0, y: 10, scaleY: 1 },
          {
            opacity: 1,
            y: 0,
            scaleY: 1,
            duration: 0.3,
            ease,
            transformOrigin: "top center",
          }
        );
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: 10,
          scaleY: 1,
          duration: 0.2,
          ease,
          transformOrigin: "top center",
          onComplete: () => {
            gsap.set(menu, { visibility: "hidden" });
          },
        });
      }
    }

    onMobileMenuClick?.();
  };

  const isExternalLink = (href) =>
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("//") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#");

  const isRouterLink = (href) => href && !isExternalLink(href);

  const cssVars = {
    ["--base"]: baseColor,
    ["--pill-bg"]: pillColor,
    ["--hover-text"]: hoveredPillTextColor,
    ["--pill-text"]: resolvedPillTextColor,
    ["--nav-h"]: "42px",
    ["--logo"]: "38px",
    ["--pill-pad-x"]: "22px",
    ["--pill-gap"]: "8px",
  };

  return (
    <div className={`fixed top-4 md:top-6 z-[1000] left-1/2 -translate-x-1/2 w-full max-w-[calc(100vw-2rem)] md:w-auto md:max-w-none px-4 md:px-0 ${isMapPage ? "map-page-navbar-container" : ""}`}>
      <nav
        className={`w-full md:w-max flex items-center justify-between md:justify-start box-border ${className} ${isMapPage ? "bg-purple-600/30 backdrop-blur-xl rounded-full px-4 py-2 border-2 border-purple-400/50 shadow-xl" : ""}`}
        aria-label="Primary"
        style={cssVars}
      >
        {isRouterLink(items?.[0]?.href) ? (
          <Link
            to={items[0].href}
            aria-label="Home"
            onMouseEnter={handleLogoEnter}
            role="menuitem"
            ref={(el) => {
              logoRef.current = el;
            }}
            className="rounded-full p-1 inline-flex items-center justify-center overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-200 active:scale-95"
            style={{
              width: "var(--nav-h)",
              height: "var(--nav-h)",
              background: "transparent",
            }}
          >
            <img
              src={logo}
              alt={logoAlt}
              ref={logoImgRef}
              className="w-full h-full object-cover block rounded-full"
            />
          </Link>
        ) : (
          <a
            href={items?.[0]?.href || "#"}
            aria-label="Home"
            onMouseEnter={handleLogoEnter}
            ref={(el) => {
              logoRef.current = el;
            }}
            className="rounded-full p-1 inline-flex items-center justify-center overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-200 active:scale-95"
            style={{
              width: "var(--nav-h)",
              height: "var(--nav-h)",
              background: "transparent",
            }}
          >
            <img
              src={logo}
              alt={logoAlt}
              ref={logoImgRef}
              className="w-full h-full object-cover block rounded-full"
            />
          </a>
        )}

        <div
          ref={navItemsRef}
          className="relative items-center rounded-full hidden md:flex ml-3 bg-white/10 backdrop-blur-md border border-white/20 shadow-lg"
          style={{
            height: "var(--nav-h)",
            background: "transparent",
          }}
        >
          <ul
            role="menubar"
            className="list-none flex items-stretch m-0 p-[3px] h-full"
            style={{ gap: "var(--pill-gap)" }}
          >
            {items.map((item, i) => {
              const isActive = activeHref === item.href;

              const pillStyle = {
                background: "var(--pill-bg, #fff)",
                color: "var(--pill-text, var(--base, #000))",
                paddingLeft: "var(--pill-pad-x)",
                paddingRight: "var(--pill-pad-x)",
              };

              const PillContent = (
                <>
                  <span
                    className="hover-circle absolute left-1/2 bottom-0 rounded-full z-[1] block pointer-events-none"
                    style={{
                      background: "var(--base, #000)",
                      willChange: "transform",
                    }}
                    aria-hidden="true"
                    ref={(el) => {
                      circleRefs.current[i] = el;
                    }}
                  />
                  <span className="label-stack relative inline-block leading-[1] z-[2]">
                    <span
                      className="pill-label relative z-[2] inline-block leading-[1]"
                      style={{ willChange: "transform" }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="pill-label-hover absolute left-0 top-0 z-[3] inline-block"
                      style={{
                        color: "var(--hover-text, #fff)",
                        willChange: "transform, opacity",
                      }}
                      aria-hidden="true"
                    >
                      {item.label}
                    </span>
                  </span>
                  {/* {isActive && (
                    <span
                      className="absolute left-1/2 -bottom-[6px] -translate-x-1/2 w-3 h-3 rounded-full z-[4]"
                      style={{ background: 'var(--base, #000)' }}
                      aria-hidden="true"
                    />
                  )} */}
                </>
              );

              const basePillClasses =
                "relative overflow-hidden inline-flex items-center justify-center h-full no-underline rounded-full box-border font-semibold text-[16px] leading-[0] uppercase tracking-[0.2px] whitespace-nowrap cursor-pointer px-0";

              return (
                <li key={item.href} role="none" className="flex h-full">
                  {isRouterLink(item.href) ? (
                    <Link
                      role="menuitem"
                      to={item.href}
                      className={basePillClasses}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                    >
                      {PillContent}
                    </Link>
                  ) : (
                    <a
                      role="menuitem"
                      href={item.href}
                      className={basePillClasses}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                    >
                      {PillContent}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <button
          ref={hamburgerRef}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
          className="md:hidden rounded-full border-0 flex flex-col items-center justify-center gap-1.5 cursor-pointer p-0 relative bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-200 active:scale-95"
          style={{
            width: "var(--nav-h)",
            height: "var(--nav-h)",
            minWidth: "var(--nav-h)",
            minHeight: "var(--nav-h)",
          }}
        >
          {/* Hamburger lines (shown when menu is closed) */}
          <span
            className="hamburger-line w-5 h-0.5 rounded-full transition-all duration-300"
            style={{ 
              background: "#ffffff",
              opacity: isMobileMenuOpen ? 0 : 1,
              transform: isMobileMenuOpen ? "scale(0)" : "scale(1)",
            }}
          />
          <span
            className="hamburger-line w-5 h-0.5 rounded-full transition-all duration-300"
            style={{ 
              background: "#ffffff",
              opacity: isMobileMenuOpen ? 0 : 1,
              transform: isMobileMenuOpen ? "scale(0)" : "scale(1)",
            }}
          />
          {/* Dot (shown when menu is open) */}
          <span
            className="absolute w-2 h-2 rounded-full transition-all duration-300"
            style={{ 
              background: "#ffffff",
              top: "50%",
              left: "50%",
              marginLeft: "-4px",
              marginTop: "-4px",
              opacity: isMobileMenuOpen ? 1 : 0,
              transform: isMobileMenuOpen ? "scale(1)" : "scale(0)",
            }}
          />
        </button>
      </nav>

      <div
        ref={mobileMenuRef}
        className="md:hidden absolute top-[calc(var(--nav-h)_+_16px)] left-4 right-4 rounded-2xl shadow-2xl z-[998] origin-top border border-white/30 overflow-hidden"
        style={{
          ...cssVars,
          background: "rgba(15, 23, 42, 0.95)", // slate-900 with high opacity
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Menu Header */}
        <div className="p-4 pb-3 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">Menu</h3>
        </div>
        
        <ul className="list-none m-0 p-3 flex flex-col gap-2">
          {items.map((item, index) => {
            const isActive = activeHref === item.href;
            const defaultStyle = {
              color: isActive ? "#a78bfa" : "#e2e8f0",
            };
            
            const hoverIn = (e) => {
              if (!isActive) {
                e.currentTarget.style.background = "rgba(139, 92, 246, 0.2)";
                e.currentTarget.style.color = "#c4b5fd";
              }
            };
            const hoverOut = (e) => {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#e2e8f0";
              }
            };

            // Icon mapping for menu items
            const getIcon = (label) => {
              const iconMap = {
                "Home": "🏠",
                "Map": "🗺️",
                "Start AR": "🚀",
                "AI Assistant": "🤖",
                "Find": "👨‍🏫",
              };
              return iconMap[label] || "•";
            };

            const linkClasses = `block py-3.5 px-5 text-base font-semibold rounded-xl transition-all duration-200 ease-in-out ${
              isActive 
                ? "bg-gradient-to-r from-purple-600/30 to-indigo-600/30 text-purple-300 border border-purple-500/30" 
                : "hover:bg-purple-500/10 text-slate-200"
            } active:scale-95`;

            return (
              <li key={item.href}>
                {isRouterLink(item.href) ? (
                  <Link
                    to={item.href}
                    className={linkClasses}
                    style={defaultStyle}
                    onMouseEnter={hoverIn}
                    onMouseLeave={hoverOut}
                    onTouchStart={(e) => {
                      e.currentTarget.style.transform = "scale(0.95)";
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    onClick={() => {
                      toggleMobileMenu();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="flex items-center gap-3 w-full">
                      <span className="text-xl flex-shrink-0">{getIcon(item.label)}</span>
                      <span className="flex-1 text-left">{item.label}</span>
                      {isActive && (
                        <span className="text-purple-400 flex-shrink-0">●</span>
                      )}
                    </span>
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    className={linkClasses}
                    style={defaultStyle}
                    onMouseEnter={hoverIn}
                    onMouseLeave={hoverOut}
                    onTouchStart={(e) => {
                      e.currentTarget.style.transform = "scale(0.95)";
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    onClick={() => {
                      toggleMobileMenu();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="flex items-center gap-3 w-full">
                      <span className="text-xl flex-shrink-0">{getIcon(item.label)}</span>
                      <span className="flex-1 text-left">{item.label}</span>
                      {isActive && (
                        <span className="text-purple-400 flex-shrink-0">●</span>
                      )}
                    </span>
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default PillNav;
