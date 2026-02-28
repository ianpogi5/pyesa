import { Routes, Route, Navigate } from "react-router-dom";
import SetsPage from "./pages/SetsPage";
import LibraryPage from "./pages/LibraryPage";
import RosarioPage from "./pages/RosarioPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/sets" replace />} />
      <Route path="/sets" element={<SetsPage />} />
      <Route path="/sets/:filename" element={<SetsPage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/library/:songId" element={<LibraryPage />} />
      <Route path="/rosario" element={<RosarioPage />} />
      {/* Legacy route */}
      <Route path="/kantada" element={<Navigate to="/rosario" replace />} />
      <Route path="*" element={<Navigate to="/sets" replace />} />
    </Routes>
  );
}
