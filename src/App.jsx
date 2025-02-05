import { useEffect, useState, useCallback } from "react";
import { FiMenu } from "react-icons/fi";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ContentArea from "./components/ContentArea";
import Kantada from "./components/Kantada";
import InstallPWA from "./components/InstallPWA";
import "./App.css";

const App = () => {
  const [initialLoad, setInitialLoad] = useState(true);
  const [files, setFiles] = useState([]);
  const [fileContent, setFileContent] = useState(null); // List of songs in the selected file
  const [selectedFile, setSelectedFile] = useState(null); // File name
  const [currentSongIndex, setCurrentSongIndex] = useState(null); // Index of the currently selected song
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Navigation and URL handling
  const location = useLocation();
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const loadFile = useCallback(
    async (filename) => {
      try {
        const response = await fetch(`${API_BASE_URL}/files/${filename}`);
        const data = await response.json();
        setFileContent(data.songs);
        setSelectedFile(filename);
        setCurrentSongIndex(null); // Reset song selection
      } catch (error) {
        console.error("Error fetching file content:", error);
      }
    },
    [API_BASE_URL]
  );

  // Load the list of files on initial render
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/files`);
        const data = await response.json();
        setFiles(data.files);

        const params = new URLSearchParams(location.search);
        const filename = params.get("set");
        if (!filename && data.files.length > 0 && initialLoad) {
          navigate(`/?set=${data.files[0]}`);
        }

        if (initialLoad) {
          setInitialLoad(false);
        }
      } catch (error) {
        console.error("Error fetching file list:", error);
      }
    };

    fetchFiles();
  }, [API_BASE_URL, navigate, location.search, initialLoad]);

  // Handle screen resizing
  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sidebar toggle
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    // Check URL for the "set" query parameter and load the corresponding file
    const params = new URLSearchParams(location.search);
    const filename = params.get("set"); // Extract `set` param (e.g., "filename.json")
    if (filename) {
      loadFile(filename);
    }
  }, [loadFile, location.search]);

  // Handle file click: Fetch file content (songs)
  const handleFileClick = async (index) => {
    const filename = files[index];
    // Update URL with the selected file name
    navigate(`/?set=${filename}`);
    // Load the file content
    loadFile(filename);
  };

  // Handle song selection by index
  const handleSongClick = (index) => {
    setCurrentSongIndex(index);
    // Scroll to the top of the content area when a song is selected from the sidebar
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (isSmallScreen) setIsSidebarOpen(false); // Hide sidebar on small screens
  };

  // Handle navigation via Previous/Next buttons
  const goToPreviousSong = () => {
    if (currentSongIndex > 0) {
      setCurrentSongIndex((prevIndex) => prevIndex - 1);
    }

    // Scroll to the top on navigation
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToNextSong = () => {
    if (currentSongIndex < fileContent.length - 1) {
      setCurrentSongIndex((prevIndex) => prevIndex + 1);
    }

    // Scroll to the top on navigation
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle back button to return to file list
  const goBackToFileList = () => {
    setFileContent(null);
    setSelectedFile(null);
    setCurrentSongIndex(null);
    navigate("/"); // Reset the URL to the base
  };

  // Handle kantada
  const handleKantada = () => {
    navigate(`/kantada`);
    if (isSmallScreen) setIsSidebarOpen(false); // Hide sidebar on small screens
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1 className="app-title">
          PG Choir - Pyesa
          <InstallPWA />
        </h1>

        {isSmallScreen && (
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <FiMenu size={14} />
          </button>
        )}
      </div>
      <div className={`layout ${isSidebarOpen ? "" : "sidebar-hidden"}`}>
        {isSidebarOpen && (
          <Sidebar
            selectedFile={selectedFile}
            items={selectedFile ? fileContent : files}
            isSongList={!!selectedFile}
            onItemClick={selectedFile ? handleSongClick : handleFileClick}
            currentSongIndex={currentSongIndex}
            onBack={selectedFile ? goBackToFileList : null}
            handleKantada={handleKantada}
          />
        )}
        <Routes>
          <Route
            path="/"
            element={
              <ContentArea
                selectedFile={selectedFile}
                selectedSong={
                  fileContent ? fileContent[currentSongIndex] : null
                }
                currentIndex={currentSongIndex}
                totalSongs={fileContent ? fileContent.length : 0}
                onPrevious={goToPreviousSong}
                onNext={goToNextSong}
              />
            }
          />
          <Route path="kantada" element={<Kantada />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
