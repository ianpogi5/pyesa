import React from "react";
import "./Sidebar.css";

const Sidebar = ({
  items,
  isSongList,
  onItemClick,
  currentSongIndex,
  onBack,
}) => {
  return (
    <div className="sidebar">
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
