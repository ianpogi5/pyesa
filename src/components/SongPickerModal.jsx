import { useState, useEffect, useCallback, useRef } from "react";
import { FiX, FiMusic, FiSearch } from "react-icons/fi";
import SearchBar from "./SearchBar";
import SongCard from "./SongCard";
import SongViewer from "./SongViewer";
import { searchSongs, getAllSongs } from "../db/index";

/**
 * Modal for picking and viewing songs.
 * Used in the Rosario Kantada page at (AWIT) markers.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - suggestedSongs: Song[] (from rosario set)
 */
export default function SongPickerModal({
  open,
  onClose,
  suggestedSongs = [],
}) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [allSongs, setAllSongs] = useState([]);
  const backdropRef = useRef(null);

  useEffect(() => {
    if (open) {
      setSelectedSong(null);
      setQuery("");
      setSearchResults([]);
      // Load all songs for browsing
      getAllSongs().then((songs) => {
        songs.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setAllSongs(songs);
      });
    }
  }, [open]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleSearch = useCallback(async (q) => {
    setQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const results = await searchSongs(q);
    results.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    setSearchResults(results);
  }, []);

  const handleSongClick = (song) => {
    setSelectedSong(song);
  };

  const handleBackToList = () => {
    setSelectedSong(null);
  };

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  if (!open) return null;

  const displaySongs = query.trim()
    ? searchResults
    : suggestedSongs.length > 0
      ? suggestedSongs
      : allSongs;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] bg-black/50 flex items-end md:items-center md:justify-center"
    >
      <div className="bg-base w-full h-[85dvh] md:h-[80vh] md:max-w-lg md:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface">
          {selectedSong ? (
            <button
              onClick={handleBackToList}
              className="text-sm font-medium text-blue"
            >
              &larr; Back
            </button>
          ) : (
            <h3 className="text-base font-bold flex items-center gap-2">
              <FiMusic size={16} className="text-blue" />
              Pick a Song
            </h3>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {selectedSong ? (
          /* Song viewer */
          <div className="flex-1 overflow-hidden">
            <SongViewer song={selectedSong} />
          </div>
        ) : (
          /* Song picker list */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 pt-3 pb-2">
              <SearchBar
                value={query}
                onChange={handleSearch}
                placeholder="Search all songs..."
              />
            </div>

            {!query.trim() && suggestedSongs.length > 0 && (
              <div className="px-4 py-1.5">
                <p className="text-[10px] font-semibold text-overlay uppercase tracking-wider">
                  Suggested Songs
                </p>
              </div>
            )}

            {query.trim() && (
              <div className="px-4 py-1.5">
                <p className="text-xs text-overlay">
                  {searchResults.length} result
                  {searchResults.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {displaySongs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <FiSearch size={24} className="text-overlay mb-2" />
                  <p className="text-sm text-subtext">
                    {query.trim()
                      ? "No songs found. Try a different search."
                      : "No songs in library yet. Open a set first."}
                  </p>
                </div>
              ) : (
                displaySongs.map((song) => (
                  <SongCard
                    key={song.Id}
                    song={song}
                    showIndex={false}
                    isActive={false}
                    onClick={() => handleSongClick(song)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
