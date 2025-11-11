import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ARPage from "./pages/ARPage";
import MapPage from "./pages/MapPage";
import FindTeacherPage from "./pages/FindTeacherPage";
import AIAssistant from "./components/AIAssistant";
import AIFullScreenChat from "./components/AIFullScreenChat";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ar" element={<ARPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/find-teacher" element={<FindTeacherPage />} />
        <Route path="/ai-chat" element={<AIFullScreenChat />} />
      </Routes>
      <AIAssistant />
    </Router>
  );
}

export default App;
