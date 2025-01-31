import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import ContentArea from "./components/ContentArea";
import "./App.css";

const App = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch files from API
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/files`);
        const data = await response.json();
        setFiles(data.files);
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };

    fetchFiles();
  }, [API_BASE_URL]);

  // Add responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="app">
      {isSmallScreen && (
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
        </button>
      )}
      <div className={`layout ${isSidebarOpen ? "sidebar-open" : ""}`}>
        {(isSidebarOpen || !isSmallScreen) && (
          <Sidebar
            files={files}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
          />
        )}
        <ContentArea selectedFile={selectedFile} />
      </div>
    </div>
  );
};

export default App;
