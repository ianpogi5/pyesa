import "./Sidebar.css";

const Sidebar = ({ files, selectedFile, onSelectFile }) => {
  return (
    <div className="sidebar">
      <h3>Files</h3>
      <ul>
        {files.map((file) => (
          <li
            key={file}
            className={file === selectedFile ? "selected" : ""}
            onClick={() => onSelectFile(file)}
          >
            {file}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
