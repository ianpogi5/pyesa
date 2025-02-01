import React, { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import ContentArea from "./components/ContentArea";
import "./App.css";

const App = () => {
  const [files, setFiles] = useState([]);
  const [fileContent, setFileContent] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch the list of files on initial load
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

  // Handle screen resizing
  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Toggle the sidebar (for mobile responsiveness)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Fetch the content of a file when it is selected
  const handleFileClick = async (filename) => {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${filename}`);
      const data = await response.json();
      setFileContent(data.songs);
      setSelectedFile(filename);
    } catch (error) {
      console.error("Error fetching file content:", error);
    }
  };

  // Handle song selection
  const handleSongClick = (song) => {
    setSelectedSong(song);
    if (isSmallScreen) setIsSidebarOpen(false); // Hide the sidebar for mobile view
  };

  // Handle returning to the file list
  const goBackToFileList = () => {
    setFileContent(null);
    setSelectedFile(null);
    setSelectedSong(null);
  };

  return (
    <div className="app">
      {isSmallScreen && (
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
        </button>
      )}
      <div className={`layout ${isSidebarOpen ? "" : "sidebar-hidden"}`}>
        {isSidebarOpen && (
          <Sidebar
            items={selectedFile ? fileContent : files}
            isSongList={!!selectedFile}
            onItemClick={selectedFile ? handleSongClick : handleFileClick}
            onBack={selectedFile ? goBackToFileList : null}
          />
        )}
        <ContentArea selectedFile={selectedFile} selectedSong={selectedSong} />
      </div>
    </div>
  );
};

export default App;
