import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SetsPage from "./pages/SetsPage";
import LibraryPage from "./pages/LibraryPage";
import RosarioPage from "./pages/RosarioPage";
import { rebuildSongsIfNeeded } from "./db/index";

export default function App() {
  // On startup, rebuild songs store if a v1→v2 DB upgrade wiped it
  useEffect(() => {
    rebuildSongsIfNeeded();
  }, []);

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
