import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChordProParser, TextFormatter } from "chordsheetjs";
import {
  FiMusic,
  FiType,
  FiPlus,
  FiMinus,
  FiChevronLeft,
  FiChevronRight,
  FiArrowUp,
  FiPlay,
  FiPause,
} from "react-icons/fi";
import YouTubeEmbed from "./YouTubeEmbed";

function parseSong(content) {
  try {
    const parser = new ChordProParser();
    return parser.parse(content || "");
  } catch {
    return null;
  }
}

function renderLyricsOnly(parsed) {
  if (!parsed) return null;
  const elements = [];

  parsed.lines.forEach((line, li) => {
    // Section comment
    if (
      line.items &&
      line.items.length > 0 &&
      line.items[0].name === "comment"
    ) {
      elements.push(
        <div key={`c-${li}`} className="comment">
          {line.items[0].value}
        </div>,
      );
      return;
    }

    const text = line.items
      ?.map((item) => {
        if (item.chords && item.lyrics) return item.lyrics;
        if (item.lyrics) return item.lyrics;
        return "";
      })
      .join("")
      .trim();

    // Skip intro/chord-only lines
    if (!text || text.match(/^intro/i)) return;

    elements.push(
      <div key={`l-${li}`} className="lyrics-line">
        {text}
      </div>,
    );
  });

  return elements;
}

function renderWithChords(content) {
  try {
    const parser = new ChordProParser();
    const song = parser.parse(content || "");
    const formatter = new TextFormatter();
    return formatter.format(song);
  } catch {
    return content;
  }
}

export default function SongViewer({
  song,
  onNext,
  onPrevious,
  currentIndex,
  totalSongs,
}) {
  const [lyricsOnly, setLyricsOnly] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [autoScroll, setAutoScroll] = useState(false);
  const contentRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const touchStart = useRef(null);

  const parsed = useMemo(() => parseSong(song?.content), [song?.content]);

  // Reset scroll on song change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    setAutoScroll(false);
  }, [song?.Id]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && contentRef.current) {
      scrollIntervalRef.current = setInterval(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop += 1;
          // Stop at bottom
          const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
          if (scrollTop + clientHeight >= scrollHeight) {
            setAutoScroll(false);
          }
        }
      }, 50);
    }
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [autoScroll]);

  // Touch swipe for navigation
  const handleTouchStart = useCallback((e) => {
    touchStart.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      if (touchStart.current === null) return;
      const diff = touchStart.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 80) {
        if (diff > 0 && onNext) onNext();
        else if (diff < 0 && onPrevious) onPrevious();
      }
      touchStart.current = null;
    },
    [onNext, onPrevious],
  );

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!song) {
    return (
      <div className="flex items-center justify-center h-full text-subtext">
        <p>Select a song to view</p>
      </div>
    );
  }

  const tags = (() => {
    try {
      return JSON.parse(song._tags || "[]");
    } catch {
      return [];
    }
  })();

  return (
    <div
      className="flex flex-col h-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Song header */}
      <div className="flex-none px-4 pt-3 pb-2 bg-mantle border-b border-surface md:px-6">
        <h2 className="text-lg font-bold leading-tight md:text-xl">
          {song.name}
        </h2>
        {(song.subTitle || song.author) && (
          <p className="text-sm text-subtext mt-0.5">
            {song.subTitle && <span>{song.subTitle}</span>}
            {song.subTitle && song.author && <span> · </span>}
            {song.author && <span>{song.author}</span>}
          </p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium text-subtext bg-surface px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-1.5 mt-2.5 -mb-0.5 overflow-x-auto">
          <button
            onClick={() => setLyricsOnly(!lyricsOnly)}
            className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
              !lyricsOnly
                ? "bg-blue text-base"
                : "bg-surface text-subtext hover:bg-surface-hover"
            }`}
          >
            {lyricsOnly ? <FiMusic size={12} /> : <FiType size={12} />}
            {lyricsOnly ? "Chords" : "Lyrics"}
          </button>

          <div className="flex items-center bg-surface rounded-lg">
            <button
              onClick={() => setFontSize((s) => Math.max(s - 2, 10))}
              disabled={fontSize <= 10}
              className="p-1.5 text-subtext hover:text-text disabled:opacity-30 transition-colors"
            >
              <FiMinus size={14} />
            </button>
            <span className="text-xs text-subtext w-6 text-center">
              {fontSize}
            </span>
            <button
              onClick={() => setFontSize((s) => Math.min(s + 2, 32))}
              disabled={fontSize >= 32}
              className="p-1.5 text-subtext hover:text-text disabled:opacity-30 transition-colors"
            >
              <FiPlus size={14} />
            </button>
          </div>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
              autoScroll
                ? "bg-green text-base"
                : "bg-surface text-subtext hover:bg-surface-hover"
            }`}
            title="Auto-scroll"
          >
            {autoScroll ? <FiPause size={12} /> : <FiPlay size={12} />}
            <span className="hidden sm:inline">Scroll</span>
          </button>

          <button
            onClick={scrollToTop}
            className="p-1.5 bg-surface text-subtext hover:bg-surface-hover rounded-lg transition-colors"
            title="Scroll to top"
          >
            <FiArrowUp size={14} />
          </button>
        </div>
      </div>

      {/* Song content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto px-4 py-4 md:px-6 pb-8"
        style={{ fontSize: `${fontSize}px` }}
      >
        {lyricsOnly ? (
          <div className="song-content lyrics-only">
            {renderLyricsOnly(parsed)}
          </div>
        ) : (
          <pre className="song-content font-mono text-sm whitespace-pre-wrap leading-relaxed">
            {renderWithChords(song.content)}
          </pre>
        )}

        {song.Url && <YouTubeEmbed url={song.Url} />}
      </div>

      {/* Navigation footer */}
      {totalSongs > 1 && (
        <div className="flex-none flex items-center justify-between px-4 py-2 bg-mantle border-t border-surface md:px-6">
          <button
            onClick={onPrevious}
            disabled={currentIndex <= 0}
            className="flex items-center gap-1 text-sm font-medium text-subtext hover:text-text disabled:opacity-30 transition-colors px-2 py-1.5"
          >
            <FiChevronLeft size={16} />
            Prev
          </button>
          <span className="text-xs text-overlay">
            {currentIndex + 1} / {totalSongs}
          </span>
          <button
            onClick={onNext}
            disabled={currentIndex >= totalSongs - 1}
            className="flex items-center gap-1 text-sm font-medium text-subtext hover:text-text disabled:opacity-30 transition-colors px-2 py-1.5"
          >
            Next
            <FiChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
