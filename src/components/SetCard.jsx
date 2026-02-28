import { FiCalendar, FiMusic } from "react-icons/fi";

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export default function SetCard({ set, isActive, onClick, songCount }) {
  return (
    <button
      onClick={() => onClick(set)}
      className={`w-full text-left px-4 py-3 transition-colors border-b border-surface/50 ${
        isActive
          ? "bg-blue/10 border-l-2 border-l-blue"
          : "hover:bg-surface/50 active:bg-surface border-l-2 border-l-transparent"
      }`}
    >
      <p
        className={`text-sm font-semibold leading-tight ${isActive ? "text-blue" : "text-text"}`}
      >
        {set.name}
      </p>
      <div className="flex items-center gap-3 mt-1">
        <span className="flex items-center gap-1 text-xs text-subtext">
          <FiCalendar size={10} />
          {formatDate(set.date)}
        </span>
        {songCount != null && (
          <span className="flex items-center gap-1 text-xs text-subtext">
            <FiMusic size={10} />
            {songCount} songs
          </span>
        )}
      </div>
    </button>
  );
}
