import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import DesktopSidebar from "../components/DesktopSidebar";
import SearchBar from "../components/SearchBar";
import SongCard from "../components/SongCard";
import SongViewer from "../components/SongViewer";
import EmptyState from "../components/EmptyState";
import {
  getAllSongs,
  searchSongs,
  getSongBySlug,
  saveSet,
  getAllSets,
} from "../db/index";
import { FiBook, FiLoader, FiDownloadCloud } from "react-icons/fi";

export default function LibraryPage() {
  const { songId } = useParams();
  const navigate = useNavigate();

  const [allSongs, setAllSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedSong, setSelectedSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState(songId ? "viewer" : "list");
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [allSetsDownloaded, setAllSetsDownloaded] = useState(false);
  const [setsManifest, setSetsManifest] = useState([]);

  // Load all songs from IndexedDB
  const loadSongs = useCallback(async () => {
    setLoading(true);
    try {
      const songs = await getAllSongs();
      // Sort alphabetically by name
      songs.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setAllSongs(songs);
      setFilteredSongs(songs);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  // Fetch sets manifest to check download state
  useEffect(() => {
    fetch("/files/sets.json")
      .then((r) => r.json())
      .then((data) => {
        setSetsManifest(data);
        getAllSets().then((saved) => {
          const savedNames = new Set(saved.map((s) => s.filename));
          setAllSetsDownloaded(data.every((s) => savedNames.has(s.filename)));
        });
      })
      .catch(() => {});
  }, []);

  const handleDownloadAll = async () => {
    if (downloadProgress || setsManifest.length === 0) return;
    setDownloadProgress({ current: 0, total: setsManifest.length });
    for (let i = 0; i < setsManifest.length; i++) {
      try {
        const res = await fetch(
          `/files/mass/${encodeURIComponent(setsManifest[i].filename)}`,
        );
        const data = await res.json();
        await saveSet(setsManifest[i].filename, data.songs || []);
      } catch {
        // skip failed
      }
      setDownloadProgress({ current: i + 1, total: setsManifest.length });
    }
    setAllSetsDownloaded(true);
    setTimeout(() => {
      setDownloadProgress(null);
      loadSongs(); // Refresh song list
    }, 1500);
  };

  // Load specific song from URL param (slug)
  useEffect(() => {
    if (songId) {
      getSongBySlug(decodeURIComponent(songId)).then((song) => {
        if (song) {
          setSelectedSong(song);
          setMobileView("viewer");
        }
      });
    }
  }, [songId]);

  // Search
  const handleSearch = useCallback(
    async (q) => {
      setQuery(q);
      if (!q.trim()) {
        setFilteredSongs(allSongs);
      } else {
        const results = await searchSongs(q);
        results.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setFilteredSongs(results);
      }
    },
    [allSongs],
  );

  const handleSongClick = (song) => {
    setSelectedSong(song);
    navigate(`/library/${encodeURIComponent(song.slug)}`);
    setMobileView("viewer");
  };

  const handleBack = () => {
    setMobileView("list");
    setSelectedSong(null);
    navigate("/library", { replace: true });
  };

  const mobileTitle =
    mobileView === "viewer" && selectedSong ? selectedSong.name : "Library";

  // Sidebar content (shared between mobile list and desktop sidebar)
  const downloadBar = downloadProgress && (
    <div className="px-3 py-2 border-b border-surface">
      <div className="flex items-center justify-between text-xs text-subtext mb-1">
        <span>
          {downloadProgress.current < downloadProgress.total
            ? `Downloading ${downloadProgress.current + 1} of ${downloadProgress.total}...`
            : `Done! All songs saved.`}
        </span>
        <span>
          {Math.round(
            (downloadProgress.current / downloadProgress.total) * 100,
          )}
          %
        </span>
      </div>
      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
        <div
          className="h-full bg-blue rounded-full transition-all duration-300"
          style={{
            width: `${(downloadProgress.current / downloadProgress.total) * 100}%`,
          }}
        />
      </div>
    </div>
  );

  const downloadAllButton = !downloadProgress &&
    setsManifest.length > 0 &&
    !allSetsDownloaded && (
      <div className="px-3 py-2 border-b border-surface">
        <button
          onClick={handleDownloadAll}
          className="flex items-center justify-center gap-2 w-full text-xs font-medium text-blue px-3 py-2 bg-blue/10 rounded-lg hover:bg-blue/20 active:bg-blue/30 transition-colors"
        >
          <FiDownloadCloud size={14} />
          Download All Songs
        </button>
      </div>
    );

  const songList = (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2">
        <SearchBar
          value={query}
          onChange={handleSearch}
          placeholder="Search songs..."
        />
        <p className="text-xs text-overlay mt-2 px-1">
          {filteredSongs.length} song{filteredSongs.length !== 1 ? "s" : ""}
        </p>
      </div>
      {downloadBar}
      {downloadAllButton}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FiLoader size={20} className="animate-spin text-overlay" />
          </div>
        ) : filteredSongs.length === 0 ? (
          <EmptyState
            icon={FiBook}
            title={allSongs.length === 0 ? "Library is empty" : "No results"}
            message={
              allSongs.length === 0
                ? "Open a set to start building your song library."
                : "Try a different search term."
            }
          />
        ) : (
          filteredSongs.map((song) => (
            <SongCard
              key={song.slug}
              song={song}
              showIndex={false}
              isActive={selectedSong?.slug === song.slug}
              onClick={() => handleSongClick(song)}
            />
          ))
        )}
      </div>
    </div>
  );

  return (
    <Layout
      title={mobileTitle}
      showBack={mobileView === "viewer"}
      onBack={handleBack}
    >
      <div className="flex h-full">
        {/* Desktop sidebar */}
        <DesktopSidebar>{songList}</DesktopSidebar>

        {/* Mobile views */}
        <div className="flex-1 flex flex-col md:hidden">
          {mobileView === "list" && (
            <div className="flex-1 overflow-hidden pb-14">{songList}</div>
          )}

          {mobileView === "viewer" && selectedSong && (
            <div className="flex-1 overflow-hidden pb-14">
              <SongViewer song={selectedSong} />
            </div>
          )}

          {mobileView === "viewer" && !selectedSong && (
            <EmptyState
              icon={FiBook}
              title="Song not found"
              message="This song may not be in your library yet."
            />
          )}
        </div>

        {/* Desktop content area */}
        <div className="hidden md:flex md:flex-1 md:flex-col overflow-hidden">
          {selectedSong ? (
            <SongViewer song={selectedSong} />
          ) : (
            <EmptyState
              icon={FiBook}
              title="Select a song"
              message="Choose a song from the library to view it."
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
