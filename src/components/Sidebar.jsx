import React from "react";
import "./Sidebar.css";

const Sidebar = ({
  selectedFile,
  items,
  isSongList,
  onItemClick,
  currentSongIndex,
  onBack,
}) => {
  let header = "";
  if (selectedFile) {
    const [dateStr, sunday] = selectedFile.split(" - ");
    const date = new Date(dateStr);
    const formattedDate = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);

    header = (
      <>
        <h2>{sunday.replace(".json", "")}</h2>
        <p>{formattedDate}</p>
      </>
    );
  }
  return (
    <div className="sidebar">
      {selectedFile && header}
      <div className="sidebar-header">
        <h3>{isSongList ? "Songs" : "Files"}</h3>
        {onBack && (
          <button className="back-button" onClick={onBack}>
            &larr; Back
          </button>
        )}
      </div>
      <ul>
        {items.map((item, index) => (
          <li
            key={index}
            onClick={() => onItemClick(index)}
            className={
              currentSongIndex === index
                ? "sidebar-item-card selected"
                : "sidebar-item-card"
            }
          >
            {isSongList ? (
              <div className="song-details">
                <h4>{item.name || `Song #${index + 1}`}</h4>
                {item.subTitle && <p className="sub-title">{item.subTitle}</p>}
                {item.author && <p className="author">{item.author}</p>}
              </div>
            ) : (
              <span>{item.replace(".json", "")}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
