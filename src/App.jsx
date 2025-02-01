import React, { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import ContentArea from "./components/ContentArea";
import "./App.css";

const App = () => {
  const [files, setFiles] = useState([]);
  const [fileContent, setFileContent] = useState(null); // List of songs in the selected file
  const [selectedFile, setSelectedFile] = useState(null); // File name
  const [currentSongIndex, setCurrentSongIndex] = useState(null); // Index of the currently selected song
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Load the list of files on initial render
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/files`);
        const data = await response.json();
        setFiles(data.files);
      } catch (error) {
        console.error("Error fetching file list:", error);
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

  // Sidebar toggle
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Handle file click: Fetch file content (songs)
  const handleFileClick = async (filename) => {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${filename}`);
      const data = await response.json();
      setFileContent(data.songs);
      setSelectedFile(filename);
      setCurrentSongIndex(null); // Reset song selection when opening a new file
    } catch (error) {
      console.error("Error fetching file content:", error);
    }
  };

  // Handle song selection by index
  const handleSongClick = (index) => {
    setCurrentSongIndex(index);
    if (isSmallScreen) setIsSidebarOpen(false); // Hide sidebar on small screens
  };

  // Handle navigation via Previous/Next buttons
  const goToPreviousSong = () => {
    if (currentSongIndex > 0) {
      setCurrentSongIndex((prevIndex) => prevIndex - 1);
    }
  };

  const goToNextSong = () => {
    if (currentSongIndex < fileContent.length - 1) {
      setCurrentSongIndex((prevIndex) => prevIndex + 1);
    }
  };

  // Handle back button to return to file list
  const goBackToFileList = () => {
    setFileContent(null);
    setSelectedFile(null);
    setCurrentSongIndex(null);
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
        <ContentArea
          selectedFile={selectedFile}
          selectedSong={fileContent ? fileContent[currentSongIndex] : null}
          currentIndex={currentSongIndex}
          totalSongs={fileContent ? fileContent.length : 0}
          onPrevious={goToPreviousSong}
          onNext={goToNextSong}
        />
      </div>
    </div>
  );
};

export default App;
