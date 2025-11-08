import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ARPage from "./pages/ARPage";
import MapPage from "./pages/MapPage";
import AIAssistant from "./components/AIAssistant";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ar" element={<ARPage />} />
        <Route path="/map" element={<MapPage />} />
      </Routes>
      <AIAssistant />
    </Router>
  );
}

export default App;
