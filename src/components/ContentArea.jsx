import React from "react";
import "./ContentArea.css";

const ContentArea = ({ selectedFile, selectedSong }) => {
  if (selectedSong) {
    return (
      <div className="content-area">
        <h2>{selectedSong.name || "Untitled Song"}</h2>
        {selectedSong.subTitle && <p>Album: {selectedSong.subTitle}</p>}
        {selectedSong.author && <p>By: {selectedSong.author} </p>}
        <pre>
          {selectedSong.content || "No content available for this song."}
        </pre>
      </div>
    );
  }

  if (selectedFile) {
    return (
      <div className="content-area">
        <h2>File: {selectedFile}</h2>
        <p>Please select a song from the sidebar to view its details.</p>
      </div>
    );
  }

  return (
    <div className="content-area">
      <p>Please select a file from the sidebar to view its contents.</p>
    </div>
  );
};

export default ContentArea;
