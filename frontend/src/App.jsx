import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ARPage from "./pages/ARPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ar" element={<ARPage />} />
      </Routes>
    </Router>
  );
}

export default App;
