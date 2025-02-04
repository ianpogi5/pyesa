import { useState } from "react";
import ChordSheetJS from "chordsheetjs";
import YouTubeEmbed from "./YouTubeEmbed";
import "./ContentArea.css";

const ContentArea = ({
  selectedFile,
  selectedSong,
  currentIndex,
  totalSongs,
  onPrevious,
  onNext,
}) => {
  const [fontSize, setFontSize] = useState(16); // Default font size in pixels
  const [lyricsOnly, setlyricsOnly] = useState(true);

  // Increase font size (limit to 32px)
  const increaseFontSize = () => {
    setFontSize((prevFontSize) => Math.min(prevFontSize + 2, 32));
  };

  // Decrease font size (limit to 12px)
  const decreaseFontSize = () => {
    setFontSize((prevFontSize) => Math.max(prevFontSize - 2, 12));
  };

  const toggleLyricsOnly = () => {
    setlyricsOnly((prevLyricsOnly) => !prevLyricsOnly);
  };

  if (!selectedFile) {
    return (
      <div className="content-area">
        <p>Please select a file from the sidebar to view its contents.</p>
      </div>
    );
  }

  let song = null;
  const formatter = new ChordSheetJS.TextFormatter();
  const parser = new ChordSheetJS.ChordProParser();
  if (!selectedSong) {
    return (
      <div className="content-area">
        <h2>File: {selectedFile}</h2>
        <p>Please select a song from the sidebar to view its details.</p>
      </div>
    );
  } else {
    song = parser.parse(selectedSong?.content);
  }

  let lyrics = "";
  if (lyricsOnly && song) {
    song.lines.forEach((l) => {
      const line_parts = l.items.map((i) => i?.lyrics);
      if (
        line_parts.length > 0 &&
        line_parts[0] &&
        line_parts[0].startsWith("Intro")
      )
        return;
      const line = line_parts.join("").trim();
      if (line != "") lyrics += line + "\n";
    });
    lyrics.trim();
  }

  return (
    <div className="content-area">
      <div className="song-details">
        <h2>{selectedSong.name || "Untitled Song"}</h2>
        <p>Album: {selectedSong.subTitle || "No Subtitle Available"}</p>
        <p>By: {selectedSong.author || "Unknown Author"}</p>
        <div className="content-controls">
          <button onClick={decreaseFontSize} disabled={fontSize <= 12}>
            A-
          </button>
          <span>Font Size: {fontSize}px</span>
          <button onClick={increaseFontSize} disabled={fontSize >= 32}>
            A+
          </button>
          <button
            onClick={toggleLyricsOnly}
            className={lyricsOnly ? "toggleLyrics" : "toggleLyricEnabled"}
          >
            Chords
          </button>
        </div>
        <pre style={{ fontSize: `${fontSize}px` }}>
          {lyricsOnly ? lyrics : song && formatter.format(song)}
        </pre>
        {selectedSong?.Url && <YouTubeEmbed url={selectedSong.Url} />}
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
