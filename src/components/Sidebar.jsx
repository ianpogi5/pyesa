import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({
  loading,
  selectedFile,
  items,
  isSongList,
  onItemClick,
  currentSongIndex,
  onBack,
  handleKantada,
}) => {
  const navigate = useNavigate();

  let header = "";
  if (selectedFile) {
    let [dateStr, sunday] = selectedFile.split(" - ");
    console.log(dateStr, sunday);

    const date = new Date(dateStr);
    console.log(date);
    let formattedDate = "";
    if (date instanceof Date && !isNaN(date)) {
      formattedDate = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
    } else {
      sunday = dateStr;
    }

    header = (
      <>
        <h2>{sunday.replace(".json", "")}</h2>
        <p>{formattedDate}</p>
      </>
    );
  }
  return (
    <div className="sidebar">
      {loading && (
        <div className="blinking-loader">
          <span className="loader-icon">🎵</span>
          <span>Loading...</span>
        </div>
      )}
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
