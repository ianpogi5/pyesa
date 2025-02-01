import React from "react";
import "./ContentArea.css";

const ContentArea = ({
  selectedFile,
  selectedSong,
  currentIndex,
  totalSongs,
  onPrevious,
  onNext,
}) => {
  if (!selectedFile) {
    return (
      <div className="content-area">
        <p>Please select a file from the sidebar to view its contents.</p>
      </div>
    );
  }

  if (!selectedSong) {
    return (
      <div className="content-area">
        <h2>File: {selectedFile}</h2>
        <p>Please select a song from the sidebar to view its details.</p>
      </div>
    );
  }

  return (
    <div className="content-area">
      <div className="song-details">
        <h2>{selectedSong.name || "Untitled Song"}</h2>
        <p>By: {selectedSong.author || "Unknown Author"}</p>
        <p>{selectedSong.subTitle || "No Subtitle Available"}</p>
        <pre>
          {selectedSong.content || "No content available for this song."}
        </pre>
      </div>
      <div className="navigation">
        <button onClick={onPrevious} disabled={currentIndex === 0}>
          Previous
        </button>
        <span>
          {currentIndex + 1} / {totalSongs}
        </span>
        <button onClick={onNext} disabled={currentIndex === totalSongs - 1}>
          Next
        </button>
      </div>
    </div>
  );
};

export default ContentArea;
