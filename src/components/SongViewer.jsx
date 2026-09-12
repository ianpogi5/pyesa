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
  FiMaximize,
  FiMinimize,
} from "react-icons/fi";
import YouTubeEmbed from "./YouTubeEmbed";

const MIN_FONT = 10;
const MAX_FONT = 72;
// Auto-fit never shrinks past this - on a narrow phone the longest line would
// otherwise drive the whole song down to single digits. Below it, lines wrap.
const MIN_FIT_FONT = 14;
const PREFS_KEY = "pyesa-viewer-prefs";

// Viewer preferences outlive the session; a private window or blocked storage
// just falls back to the defaults.
function loadPrefs() {
  try {
    const stored = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    return {
      lyricsOnly:
        typeof stored.lyricsOnly === "boolean" ? stored.lyricsOnly : true,
      fontSize: Number.isFinite(stored.fontSize)
        ? Math.min(MAX_FONT, Math.max(MIN_FONT, stored.fontSize))
        : 16,
    };
  } catch {
    return { lyricsOnly: true, fontSize: 16 };
  }
}

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
  const [lyricsOnly, setLyricsOnly] = useState(() => loadPrefs().lyricsOnly);
  // The remembered size. Fullscreen auto-fit overrides the rendered size
  // through fitSize without overwriting what the user picked.
  const [fontSize, setFontSize] = useState(() => loadPrefs().fontSize);
  const [fitSize, setFitSize] = useState(null);
  const [autoScroll, setAutoScroll] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  // Fullscreen sizes the text to the widest line; a manual +/- turns this off
  const [autoFit, setAutoFit] = useState(false);
  const contentRef = useRef(null);
  const containerRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const touchStart = useRef(null);
  const wakeLockRef = useRef(null);

  const parsed = useMemo(() => parseSong(song?.content), [song?.content]);

  // Size actually rendered: the auto-fitted one while it is in charge
  const displaySize = fullscreen && autoFit && fitSize ? fitSize : fontSize;

  useEffect(() => {
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ lyricsOnly, fontSize }),
      );
    } catch {
      // storage unavailable - preferences stay session-only
    }
  }, [lyricsOnly, fontSize]);

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

  // Largest font size that keeps every line on one row. Measures each rendered
  // line off-screen at its own weight/style, then scales: text width is linear
  // in font size, so one pass is enough.
  const fitFontSize = useCallback(() => {
    const content = contentRef.current;
    if (!content) return;

    const cs = getComputedStyle(content);
    const available =
      content.clientWidth -
      parseFloat(cs.paddingLeft) -
      parseFloat(cs.paddingRight);
    if (!(available > 0)) return;

    // Chords mode is one <pre>; lyrics mode is a div per line (comments are bold)
    const lines = [];
    const pre = content.querySelector("pre.song-content");
    if (pre) {
      const style = getComputedStyle(pre);
      for (const text of pre.textContent.split("\n")) {
        if (text.trim()) lines.push({ text, style });
      }
    } else {
      for (const el of content.querySelectorAll(".lyrics-line, .comment")) {
        if (el.textContent.trim())
          lines.push({ text: el.textContent, style: getComputedStyle(el) });
      }
    }
    if (lines.length === 0) return;

    const ruler = document.createElement("span");
    ruler.style.cssText =
      "position:fixed;left:-9999px;top:0;white-space:pre;visibility:hidden;";
    document.body.appendChild(ruler);

    let widest = 0;
    let widestAt = 0;
    for (const { text, style } of lines) {
      ruler.style.fontFamily = style.fontFamily;
      ruler.style.fontWeight = style.fontWeight;
      ruler.style.fontStyle = style.fontStyle;
      ruler.style.fontSize = style.fontSize;
      ruler.style.letterSpacing = style.letterSpacing;
      ruler.textContent = text;
      const width = ruler.getBoundingClientRect().width;
      if (width > widest) {
        widest = width;
        widestAt = parseFloat(style.fontSize);
      }
    }
    ruler.remove();
    if (!widest || !widestAt) return;

    const fitted = Math.floor((widestAt * available) / widest);
    setFitSize(Math.min(MAX_FONT, Math.max(MIN_FIT_FONT, fitted)));
  }, []);

  // Re-fit on entering fullscreen, and on anything that changes the line widths
  useEffect(() => {
    if (!fullscreen || !autoFit) return;
    let cancelled = false;
    let raf = 0;

    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!cancelled) fitFontSize();
      });
    };

    // Measure against the real webfont, not the fallback
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) run();
      });
    } else {
      run();
    }

    window.addEventListener("resize", run);
    window.addEventListener("orientationchange", run);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", run);
      window.removeEventListener("orientationchange", run);
    };
  }, [fullscreen, autoFit, fitFontSize, song?.Id, lyricsOnly]);

  // Fullscreen: CSS overlay always, native Fullscreen API when supported
  // (iOS Safari has no Element.requestFullscreen, so the overlay is the fallback).
  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    setFullscreen(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (fullscreen) {
      exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setAutoFit(true);
      setFullscreen(true);
    }
  }, [fullscreen, exitFullscreen]);

  // Leaving native fullscreen (Esc, browser gesture) drops the overlay too
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Esc exits the overlay where there is no native fullscreen to leave
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e) => {
      if (e.key === "Escape") exitFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, exitFullscreen]);

  // Keep the screen awake while performing; re-acquire after the tab is hidden
  useEffect(() => {
    if (!fullscreen) return;
    let cancelled = false;

    const acquire = async () => {
      try {
        const lock = await navigator.wakeLock?.request("screen");
        if (cancelled) lock?.release?.().catch(() => {});
        else wakeLockRef.current = lock;
      } catch {
        // unsupported or denied - not fatal
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") acquire();
    };

    acquire();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      wakeLockRef.current?.release?.().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [fullscreen]);

  // Never leave the browser stuck in native fullscreen if the viewer unmounts
  useEffect(
    () => () => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    },
    [],
  );

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
      ref={containerRef}
      className={
        fullscreen
          ? "fixed inset-0 z-[200] flex flex-col bg-base"
          : "flex flex-col h-full"
      }
      style={
        fullscreen
          ? {
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }
          : undefined
      }
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Song header */}
      <div
        className={`flex-none bg-mantle border-b border-surface px-4 md:px-6 ${
          fullscreen ? "pt-2 pb-1.5" : "pt-3 pb-2"
        }`}
      >
        <h2
          className={`font-bold leading-tight ${
            fullscreen ? "text-sm truncate" : "text-lg md:text-xl"
          }`}
        >
          {song.name}
        </h2>
        {!fullscreen && (song.subTitle || song.author) && (
          <p className="text-sm text-subtext mt-0.5">
            {song.subTitle && <span>{song.subTitle}</span>}
            {song.subTitle && song.author && <span> · </span>}
            {song.author && <span>{song.author}</span>}
          </p>
        )}
        {!fullscreen && tags.length > 0 && (
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
        <div
          className={`flex items-center gap-1.5 -mb-0.5 overflow-x-auto ${
            fullscreen ? "mt-1.5" : "mt-2.5"
          }`}
        >
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
              onClick={() => {
                setAutoFit(false);
                setFontSize(Math.max(displaySize - 2, MIN_FONT));
              }}
              disabled={displaySize <= MIN_FONT}
              className="p-1.5 text-subtext hover:text-text disabled:opacity-30 transition-colors"
            >
              <FiMinus size={14} />
            </button>
            <span className="text-xs text-subtext w-6 text-center">
              {displaySize}
            </span>
            <button
              onClick={() => {
                setAutoFit(false);
                setFontSize(Math.min(displaySize + 2, MAX_FONT));
              }}
              disabled={displaySize >= MAX_FONT}
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
            onClick={toggleFullscreen}
            className={`p-1.5 rounded-lg transition-colors ${
              fullscreen
                ? "bg-blue text-base"
                : "bg-surface text-subtext hover:bg-surface-hover"
            }`}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {fullscreen ? <FiMinimize size={14} /> : <FiMaximize size={14} />}
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
        style={{ fontSize: `${displaySize}px` }}
      >
        {lyricsOnly ? (
          <div className="song-content lyrics-only">
            {renderLyricsOnly(parsed)}
          </div>
        ) : (
          <pre className="song-content font-mono whitespace-pre-wrap leading-relaxed">
            {renderWithChords(song.content)}
          </pre>
        )}

        {!fullscreen && song.Url && <YouTubeEmbed url={song.Url} />}
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
