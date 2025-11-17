import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ARPage from "./pages/ARPage";
import MapPage from "./pages/MapPage";
import FindTeacherPage from "./pages/FindTeacherPage";
import EventsPage from "./pages/EventsPage";
import AIAssistant from "./components/AIAssistant";
import AIFullScreenChat from "./components/AIFullScreenChat";
import NaviGoSplash from "./components/NaviGoSplash";

function AppContent() {
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(false);
  const [splashCompleted, setSplashCompleted] = useState(false);

  useEffect(() => {
    // Check if this is a page reload or initial load
    const navigation = performance.getEntriesByType('navigation')[0];
    const isReload = navigation?.type === 'reload';
    const isInitialLoad = navigation?.type === 'navigate' && !sessionStorage.getItem("navigo-has-navigated");
    
    // Only show splash on homepage
    if (location.pathname === "/") {
      if (isReload) {
        // Clear completion flag on reload so animation shows again
        sessionStorage.removeItem("navigo-splash-completed");
        setShowSplash(true);
        setSplashCompleted(false);
      } else if (isInitialLoad) {
        // Initial load - show splash
        setShowSplash(true);
        setSplashCompleted(false);
      } else {
        // Client-side navigation back to homepage
        // Check if splash was already completed - if so, keep elements visible
        const wasCompleted = sessionStorage.getItem("navigo-splash-completed") === "true";
        if (wasCompleted) {
          setSplashCompleted(true);
          setShowSplash(true); // Keep mounted to show animated elements
        } else {
          setShowSplash(true);
          setSplashCompleted(false);
        }
      }
    } else {
      // On other pages, hide the splash completely
      setShowSplash(false);
      // Mark that we've navigated (so we know it's not initial load anymore)
      sessionStorage.setItem("navigo-has-navigated", "true");
      
      // Hide animated elements if they exist (they shouldn't show on other pages)
      const animatedNavigo = document.querySelector('[class*="logoContainer"]');
      if (animatedNavigo) {
        animatedNavigo.style.display = "none";
        animatedNavigo.style.visibility = "hidden";
        animatedNavigo.style.opacity = "0";
        animatedNavigo.style.pointerEvents = "none";
      }
      
      // Also hide the splash container
      const splashContainer = document.querySelector('[class*="splashContainer"]');
      if (splashContainer) {
        splashContainer.style.display = "none";
        splashContainer.style.visibility = "hidden";
        splashContainer.style.opacity = "0";
      }
    }
  }, [location.pathname]);

  const handleSplashComplete = () => {
    setSplashCompleted(true);
    sessionStorage.setItem("navigo-splash-completed", "true");
    // Keep showSplash true so elements stay mounted on homepage
  };

  // Only render splash on homepage
  const shouldRenderSplash = location.pathname === "/" && showSplash;

  return (
    <>
      {shouldRenderSplash && (
        <NaviGoSplash onComplete={handleSplashComplete} />
      )}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ar" element={<ARPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/find-teacher" element={<FindTeacherPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/ai-chat" element={<AIFullScreenChat />} />
      </Routes>
      <AIAssistant />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
