import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import DesktopSidebar from "../components/DesktopSidebar";
import SetCard from "../components/SetCard";
import SongCard from "../components/SongCard";
import SongViewer from "../components/SongViewer";
import EmptyState from "../components/EmptyState";
import { saveSet, getSet, getAllSets, getSongCount } from "../db/index";
import {
  FiMusic,
  FiArrowLeft,
  FiLoader,
  FiDownloadCloud,
} from "react-icons/fi";

export default function SetsPage() {
  const { filename } = useParams();
  const navigate = useNavigate();

  const [sets, setSets] = useState([]);
  const [songs, setSongs] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null); // { current, total } or null
  const [allSetsDownloaded, setAllSetsDownloaded] = useState(false);

  // Track whether we've already auto-selected on first load
  const hasAutoSelected = useRef(false);

  // Mobile navigation state: "sets" | "songs" | "viewer"
  const [mobileView, setMobileView] = useState(filename ? "songs" : "sets");

  // Fetch sets manifest
  useEffect(() => {
    fetch("/files/sets.json")
      .then((r) => r.json())
      .then((data) => {
        setSets(data);
        // Auto-select latest set only on the very first load
        if (!filename && data.length > 0 && !hasAutoSelected.current) {
          hasAutoSelected.current = true;
          const today = new Date().toISOString().split("T")[0];
          const past = data.filter((s) => s.date <= today);
          const target = past.length > 0 ? past[0] : data[0];
          navigate(`/sets/${encodeURIComponent(target.filename)}`, {
            replace: true,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filename, navigate]);

  // Check if all sets are already downloaded
  useEffect(() => {
    if (sets.length === 0) return;
    getAllSets().then(async (saved) => {
      const savedNames = new Set(saved.map((s) => s.filename));
      const allSaved = sets.every((s) => savedNames.has(s.filename));
      // Also verify songs store has songs (guard against v1→v2 upgrade wipe)
      const count = await getSongCount();
      setAllSetsDownloaded(allSaved && count > 0);
    });
  }, [sets]);

  // Load songs for selected set
  const loadSet = useCallback(async (fname) => {
    if (!fname) return;
    setLoadingSongs(true);
    try {
      // Try IndexedDB cache first
      const cached = await getSet(fname);
      if (cached) {
        setSongs(cached.songs);
        setCurrentSongIndex(0);
        setLoadingSongs(false);
        // Refresh from network in background
        fetchAndSave(fname);
        return;
      }
      await fetchAndSave(fname);
    } catch {
      setLoadingSongs(false);
    }
  }, []);

  const fetchAndSave = async (fname) => {
    try {
      const res = await fetch(`/files/mass/${encodeURIComponent(fname)}`);
      const data = await res.json();
      const songList = data.songs || [];
      setSongs(songList);
      setCurrentSongIndex(0);
      setLoadingSongs(false);
      // Save to IndexedDB
      await saveSet(fname, songList);
    } catch {
      setLoadingSongs(false);
    }
  };

  useEffect(() => {
    if (filename) {
      const decoded = decodeURIComponent(filename);
      loadSet(decoded);
      setMobileView("songs");
    }
  }, [filename, loadSet]);

  const handleSetClick = (set) => {
    navigate(`/sets/${encodeURIComponent(set.filename)}`);
    setMobileView("songs");
  };

  const handleSongClick = (song) => {
    const idx = songs.findIndex((s) => s.Id === song.Id);
    if (idx >= 0) setCurrentSongIndex(idx);
    setMobileView("viewer");
  };

  const handleNext = () => {
    if (currentSongIndex < songs.length - 1) setCurrentSongIndex((i) => i + 1);
  };

  const handlePrev = () => {
    if (currentSongIndex > 0) setCurrentSongIndex((i) => i - 1);
  };

  const handleDownloadAll = async () => {
    if (downloadProgress || sets.length === 0) return;
    setDownloadProgress({ current: 0, total: sets.length });
    for (let i = 0; i < sets.length; i++) {
      try {
        const res = await fetch(
          `/files/mass/${encodeURIComponent(sets[i].filename)}`,
        );
        const data = await res.json();
        await saveSet(sets[i].filename, data.songs || []);
      } catch {
        // skip failed sets
      }
      setDownloadProgress({ current: i + 1, total: sets.length });
    }
    // Keep completed state briefly, then clear
    setAllSetsDownloaded(true);
    setTimeout(() => setDownloadProgress(null), 1500);
  };

  const selectedFilename = filename ? decodeURIComponent(filename) : null;
  const activeSet = sets.find((s) => s.filename === selectedFilename);
  const currentSong = songs[currentSongIndex] || null;

  // Mobile title
  const mobileTitle =
    mobileView === "viewer" && currentSong
      ? currentSong.name
      : mobileView === "songs" && activeSet
        ? activeSet.name
        : "Sets";

  const showBack = mobileView === "songs" || mobileView === "viewer";

  const handleBack = () => {
    if (mobileView === "viewer") {
      setMobileView("songs");
    } else if (mobileView === "songs") {
      setMobileView("sets");
      navigate("/sets", { replace: true });
    }
  };

  // ---------- Download All progress bar ----------
  const downloadBar = downloadProgress && (
    <div className="px-3 py-2 border-b border-surface">
      <div className="flex items-center justify-between text-xs text-subtext mb-1">
        <span>
          {downloadProgress.current < downloadProgress.total
            ? `Downloading ${downloadProgress.current + 1} of ${downloadProgress.total}...`
            : `Done! ${downloadProgress.total} sets saved.`}
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
    sets.length > 0 &&
    !allSetsDownloaded && (
      <div className="px-3 py-2 border-b border-surface">
        <button
          onClick={handleDownloadAll}
          className="flex items-center justify-center gap-2 w-full text-xs font-medium text-blue px-3 py-2 bg-blue/10 rounded-lg hover:bg-blue/20 active:bg-blue/30 transition-colors"
        >
          <FiDownloadCloud size={14} />
          Download All Sets
        </button>
      </div>
    );

  // ---------- Sidebar content for desktop ----------
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* If a set is selected, show songs; otherwise show set list */}
      {selectedFilename && songs.length > 0 ? (
        <>
          <button
            onClick={() => navigate("/sets")}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-subtext hover:text-text hover:bg-surface/50 border-b border-surface transition-colors"
          >
            <FiArrowLeft size={14} />
            All Sets
          </button>
          <div className="px-3 py-2 border-b border-surface">
            <p className="text-xs font-semibold text-overlay uppercase tracking-wider">
              {activeSet?.name}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {songs.map((song, i) => (
              <SongCard
                key={song.Id}
                song={song}
                index={i}
                isActive={i === currentSongIndex}
                onClick={() => handleSongClick(song)}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          {downloadBar}
          {downloadAllButton}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <FiLoader size={20} className="animate-spin text-overlay" />
              </div>
            ) : (
              sets.map((set) => (
                <SetCard
                  key={set.filename}
                  set={set}
                  isActive={set.filename === selectedFilename}
                  onClick={handleSetClick}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <Layout title={mobileTitle} showBack={showBack} onBack={handleBack}>
      <div className="flex h-full">
        {/* Desktop sidebar */}
        <DesktopSidebar>{sidebarContent}</DesktopSidebar>

        {/* Mobile views */}
        <div className="flex-1 flex flex-col md:hidden">
          {mobileView === "sets" && (
            <div className="flex-1 overflow-y-auto pb-16">
              {downloadBar}
              {downloadAllButton}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <FiLoader size={20} className="animate-spin text-overlay" />
                </div>
              ) : sets.length === 0 ? (
                <EmptyState
                  icon={FiMusic}
                  title="No sets yet"
                  message="Song sets will appear here once available."
                />
              ) : (
                sets.map((set) => (
                  <SetCard
                    key={set.filename}
                    set={set}
                    isActive={set.filename === selectedFilename}
                    onClick={handleSetClick}
                  />
                ))
              )}
            </div>
          )}

          {mobileView === "songs" && (
            <div className="flex-1 overflow-y-auto pb-16">
              {loadingSongs ? (
                <div className="flex items-center justify-center py-12">
                  <FiLoader size={20} className="animate-spin text-overlay" />
                </div>
              ) : songs.length === 0 ? (
                <EmptyState
                  icon={FiMusic}
                  title="No songs"
                  message="This set appears to be empty."
                />
              ) : (
                songs.map((song, i) => (
                  <SongCard
                    key={song.Id}
                    song={song}
                    index={i}
                    isActive={i === currentSongIndex}
                    onClick={() => handleSongClick(song)}
                  />
                ))
              )}
            </div>
          )}

          {mobileView === "viewer" && (
            <div className="flex-1 overflow-hidden pb-14">
              <SongViewer
                song={currentSong}
                onNext={handleNext}
                onPrevious={handlePrev}
                currentIndex={currentSongIndex}
                totalSongs={songs.length}
              />
            </div>
          )}
        </div>

        {/* Desktop content area */}
        <div className="hidden md:flex md:flex-1 md:flex-col overflow-hidden">
          {currentSong ? (
            <SongViewer
              song={currentSong}
              onNext={handleNext}
              onPrevious={handlePrev}
              currentIndex={currentSongIndex}
              totalSongs={songs.length}
            />
          ) : (
            <EmptyState
              icon={FiMusic}
              title="Select a set"
              message="Choose a set from the sidebar to view its songs."
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
