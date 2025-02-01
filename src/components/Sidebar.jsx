import React from "react";
import "./Sidebar.css";

const Sidebar = ({ items, isSongList, onItemClick, onBack }) => {
  return (
    <div className="sidebar">
      {onBack && (
        <button className="back-button" onClick={onBack}>
          &larr; Back
        </button>
      )}
      <h3>{isSongList ? "Songs" : "Files"}</h3>
      <ul>
        {items.map((item, index) => (
          <li
            key={index}
            onClick={() => onItemClick(index)}
            className="sidebar-item-card"
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
