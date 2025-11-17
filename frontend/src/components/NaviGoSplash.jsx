import React, { useEffect, useState, useRef } from "react";
import styles from "./NaviGoSplash.module.css";

const NaviGoSplash = ({ onComplete }) => {
  const [isHidden, setIsHidden] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const logoRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    // Hide the original homepage elements initially
    const hideHomepageElements = () => {
      const navigoElement = document.querySelector("[data-navigo-heading]");
      const lineContainer = document.querySelector("[data-line-container]");

      if (navigoElement) {
        navigoElement.style.opacity = "0";
        navigoElement.style.visibility = "hidden";
      }
      if (lineContainer) {
        lineContainer.style.opacity = "0";
        lineContainer.style.visibility = "hidden";
      }
    };

    // Show the original homepage elements after animation completes (as backup)
    const showHomepageElements = () => {
      const navigoElement = document.querySelector("[data-navigo-heading]");
      const lineContainer = navigoElement?.parentElement?.nextElementSibling;

      // We'll keep them hidden since our animated elements will stay visible
      // But we'll keep this for fallback
    };

    // Extract exact styles from homepage NAVIGO element
    const extractHomepageStyles = () => {
      const navigoElement = document.querySelector("[data-navigo-heading]");

      if (navigoElement && logoRef.current && textRef.current) {
        const computedStyles = window.getComputedStyle(navigoElement);
        const navigoRect = navigoElement.getBoundingClientRect();
        const parentContainer = navigoElement.parentElement?.parentElement;

        // Extract exact text styles
        const fontSize = computedStyles.fontSize;
        const fontFamily = computedStyles.fontFamily;
        const fontWeight = computedStyles.fontWeight;
        const letterSpacing = computedStyles.letterSpacing;
        const lineHeight = computedStyles.lineHeight;
        const textTransform = computedStyles.textTransform;

        // Get background gradient - use homepage exact colors (purple-400, purple-500, purple-600)
        let backgroundImage = computedStyles.backgroundImage;
        // Keep the homepage gradient as is (purple-400, purple-500, purple-600)
        // Don't replace with dark purple - use the exact homepage colors

        // Extract position - get the center of the text element's final position
        const parentRect = parentContainer?.getBoundingClientRect();
        let finalTop = navigoRect.top + navigoRect.height / 2;
        let finalLeft = navigoRect.left + navigoRect.width / 2;

        // Apply styles to splash text
        if (textRef.current) {
          textRef.current.style.setProperty("--extracted-font-size", fontSize);
          textRef.current.style.setProperty(
            "--extracted-font-family",
            fontFamily
          );
          textRef.current.style.setProperty(
            "--extracted-font-weight",
            fontWeight
          );
          textRef.current.style.setProperty(
            "--extracted-letter-spacing",
            letterSpacing
          );
          textRef.current.style.setProperty(
            "--extracted-line-height",
            lineHeight
          );
          textRef.current.style.setProperty(
            "--extracted-text-transform",
            textTransform
          );
          textRef.current.style.setProperty(
            "--extracted-background",
            backgroundImage
          );
          textRef.current.classList.add(styles.usingExtracted);
        }

        // Extract margins
        const textMarginBottom = computedStyles.marginBottom;
        if (textRef.current) {
          textRef.current.style.setProperty(
            "--extracted-margin-bottom",
            textMarginBottom
          );
        }

        // Set position - use exact pixel position
        if (logoRef.current) {
          logoRef.current.style.setProperty(
            "--calculated-top",
            `${finalTop}px`
          );
          logoRef.current.style.setProperty(
            "--calculated-left",
            `${finalLeft}px`
          );
          logoRef.current.classList.add(styles.usingCalculated);
        }
      }
    };

    // Hide homepage elements first
    hideHomepageElements();

    // Wait a bit for DOM to be ready, then extract styles
    const extractTimer = setTimeout(() => {
      extractHomepageStyles();
    }, 100);

    // Start the move animation after color transition completes
    // Color transition: 2s delay + 2s duration = 4s, then wait a bit more
    const moveTimer = setTimeout(() => {
      setIsMoving(true);
      // Re-extract styles right before moving (in case viewport changed)
      extractHomepageStyles();
    }, 4300); // Wait for color transition to fully complete

    // After animation completes, keep the animated elements visible
    // Total: 1s appear + 1s white glow + 2s color transition + 1.5s move animation + 0.5s buffer = 6s
    const totalDuration = 6000; // 6 seconds total

    const completeTimer = setTimeout(() => {
      // Keep animated elements visible and in place
      if (logoRef.current) {
        logoRef.current.style.pointerEvents = "auto";
        // Ensure it stays visible above content
        logoRef.current.style.zIndex = "999";
        logoRef.current.style.opacity = "1";
        logoRef.current.style.visibility = "visible";
        logoRef.current.style.position = "fixed";
        logoRef.current.style.display = "flex";

        // Ensure all child elements are visible
        if (textRef.current) {
          textRef.current.style.opacity = "1";
          textRef.current.style.visibility = "visible";
        }

        // Show homepage line and dot after NAVIGO animation completes
        // Appear right after NAVIGO reaches final position (at end of moveToPosition animation)
        const showLineAndDot = () => {
          const lineContainer = document.querySelector("[data-line-container]");
          if (lineContainer) {
            // First make it visible
            lineContainer.style.display = "block";
            lineContainer.style.visibility = "visible";
            lineContainer.style.transition = "opacity 0.8s ease-out";

            // Trigger fade-in animation
            requestAnimationFrame(() => {
              lineContainer.style.opacity = "1";
              // Ensure it stays visible permanently
              lineContainer.setAttribute("data-splash-visible", "true");
            });

            // Also set up a persistent check to keep it visible
            const keepVisible = setInterval(() => {
              if (lineContainer) {
                lineContainer.style.opacity = "1";
                lineContainer.style.visibility = "visible";
                lineContainer.style.display = "block";
              } else {
                clearInterval(keepVisible);
              }
            }, 100);

            // Stop checking after 3 seconds (should be enough time)
            setTimeout(() => clearInterval(keepVisible), 3000);
          }
        };

        // Show immediately and also with a slight delay to ensure it happens
        showLineAndDot();
        setTimeout(showLineAndDot, 100);
      }

      // Hide the splash container background but keep the animated elements
      setIsHidden(true);

      // Wait a bit then call onComplete (but don't remove elements)
      setTimeout(() => {
        // Keep the elements visible - don't unmount them
        if (onComplete) {
          onComplete();
        }
      }, 800); // Match the transition duration
    }, totalDuration);

    // Cleanup function
    return () => {
      clearTimeout(extractTimer);
      clearTimeout(moveTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`${styles.splashContainer} ${isHidden ? styles.hidden : ""}`}
    >
      <div className={styles.pageTransition}></div>
      <div
        ref={logoRef}
        className={`${styles.logoContainer} ${isMoving ? styles.moving : ""}`}
      >
        <h1 ref={textRef} className={styles.logoText}>
          NAVIGO
        </h1>
      </div>
    </div>
  );
};

export default NaviGoSplash;
