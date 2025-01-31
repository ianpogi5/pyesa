import React, { useEffect, useState } from "react";
import "./ContentArea.css";

const ContentArea = ({ selectedFile }) => {
  const [fileContent, setFileContent] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchFileContent = async () => {
      if (selectedFile) {
        try {
          const response = await fetch(`${API_BASE_URL}/files/${selectedFile}`);
          const data = await response.text();
          setFileContent(data);
        } catch (error) {
          console.error("Error fetching file content:", error);
        }
      } else {
        setFileContent(null);
      }
    };

    fetchFileContent();
  }, [selectedFile, API_BASE_URL]);

  return (
    <div className="content-area">
      {selectedFile ? (
        <pre>{fileContent}</pre>
      ) : (
        <p>Please select a file from the sidebar to view its contents.</p>
      )}
    </div>
  );
};

export default ContentArea;
