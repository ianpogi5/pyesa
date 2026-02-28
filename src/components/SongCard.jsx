function parseTags(tagsStr) {
  if (!tagsStr) return [];
  try {
    return JSON.parse(tagsStr);
  } catch {
    return [];
  }
}

function getTagLabel(tag) {
  const labels = {
    opening: "Opening",
    "pangioon-maawa": "Kyrie",
    kyrie: "Kyrie",
    gloria: "Gloria",
    alleluia: "Alleluia",
    offertory: "Offertory",
    santo: "Santo",
    memorial: "Memorial",
    amen: "Amen",
    "our-father": "Our Father",
    "lamb-of-god": "Lamb of God",
    communion: "Communion",
    closing: "Closing",
    recessional: "Recessional",
  };
  return labels[tag] || null;
}

export default function SongCard({
  song,
  index,
  isActive,
  onClick,
  showIndex = true,
}) {
  const tags = parseTags(song._tags);
  const massTag = tags.find((t) => getTagLabel(t));

  return (
    <button
      onClick={() => onClick(song)}
      className={`w-full text-left px-4 py-3 transition-colors border-b border-surface/50 ${
        isActive
          ? "bg-blue/10 border-l-2 border-l-blue"
          : "hover:bg-surface/50 active:bg-surface border-l-2 border-l-transparent"
      }`}
    >
      <div className="flex items-start gap-2.5">
        {showIndex && index != null && (
          <span className="flex-none mt-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-surface text-[10px] font-bold text-subtext">
            {index + 1}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium leading-tight truncate ${isActive ? "text-blue" : "text-text"}`}
          >
            {song.name}
          </p>
          {(song.subTitle || song.author) && (
            <p className="text-xs text-subtext mt-0.5 truncate">
              {song.subTitle && <span>{song.subTitle}</span>}
              {song.subTitle && song.author && <span> · </span>}
              {song.author && <span>{song.author}</span>}
            </p>
          )}
        </div>
        {massTag && (
          <span className="flex-none text-[10px] font-medium text-overlay bg-surface px-1.5 py-0.5 rounded-md mt-0.5">
            {getTagLabel(massTag)}
          </span>
        )}
      </div>
    </button>
  );
}
