import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const App = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 600);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/files");
      console.log(response);

      setFiles(response.data.files);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const fetchFileContent = async (filename) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/files/${filename}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching file content:", error);
      return "";
    }
  };

  console.log(files);

  return (
    <div className="main-container">
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 1000,
        }}
      >
        {showSidebar ? "Hide Sidebar" : "Show Sidebar"}
      </button>

      <div className="columns">
        {/* Left Sidebar */}
        <div
          className="left-sidebar"
          style={{
            width: showSidebar ? "30%" : "0",
            transition: "width 0.3s ease",
          }}
        >
          <h2>Files</h2>
          {files?.map((file) => (
            <div
              key={file}
              onClick={(e) => {
                e.preventDefault();
                setSelectedFile(file);
              }}
              className={`file-item ${selectedFile === file ? "active" : ""}`}
            >
              {file}
            </div>
          ))}
        </div>

        {/* Right Content */}
        <div
          className="right-content"
          style={{ width: showSidebar ? "70%" : "100%" }}
        >
          {selectedFile ? (
            <div className="file-content">
              <h2>{selectedFile}</h2>
              <pre>{fetchFileContent(selectedFile)}</pre>
            </div>
          ) : (
            <div className="instructions">
              <h2>Instructions</h2>
              <p>Please select a file from the sidebar to view its content.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
