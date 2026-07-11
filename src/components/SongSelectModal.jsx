import { useState, useEffect, useCallback, useRef } from "react";
import { FiX, FiMusic, FiSearch } from "react-icons/fi";
import SearchBar from "./SearchBar";
import SongCard from "./SongCard";
import { searchSongs, getAllSongs } from "../db/index";

/**
 * Modal for selecting a song from the library (set builder).
 * Unlike SongPickerModal, tapping a song selects it instead of viewing it.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onSelect: (song) => void
 *  - title: string
 */
export default function SongSelectModal({
  open,
  onClose,
  onSelect,
  title = "Add a Song",
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [allSongs, setAllSongs] = useState([]);
  const backdropRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      getAllSongs().then((songs) => {
        songs.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setAllSongs(songs);
      });
    }
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleSearch = useCallback(async (q) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const found = await searchSongs(q);
    found.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    setResults(found);
  }, []);

  if (!open) return null;

  const displaySongs = query.trim() ? results : allSongs;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => e.target === backdropRef.current && onClose()}
      className="fixed inset-0 z-[100] bg-black/50 flex items-end md:items-center md:justify-center"
    >
      <div className="bg-base w-full h-[85dvh] md:h-[80vh] md:max-w-lg md:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface">
          <h3 className="font-bold flex items-center gap-2">
            <FiMusic size={16} className="text-blue" />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="px-3 pt-3 pb-2">
          <SearchBar
            value={query}
            onChange={handleSearch}
            placeholder="Search by name, author, or lyrics..."
          />
        </div>

        {query.trim() && (
          <div className="px-4 py-1.5">
            <p className="text-xs text-overlay">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {displaySongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <FiSearch size={24} className="text-overlay mb-2" />
              <p className="text-sm text-subtext">
                {query.trim()
                  ? "No songs found. Try a different search, or add it as a placeholder."
                  : "Library is loading or empty."}
              </p>
            </div>
          ) : (
            displaySongs.map((song, idx) => (
              <SongCard
                key={song.slug || `${song.Id}-${idx}`}
                song={song}
                showIndex={false}
                isActive={false}
                onClick={() => onSelect(song)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
