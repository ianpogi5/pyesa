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
  FiSettings,
} from "react-icons/fi";
import YouTubeEmbed from "./YouTubeEmbed";
import ViewerSettings from "./ViewerSettings";
import { DEFAULT_PEDAL } from "../lib/pedal";

const MIN_FONT = 10;
const MAX_FONT = 72;
// Auto-fit never shrinks past this - on a narrow phone the longest line would
// otherwise drive the whole song down to single digits. Below it, lines wrap.
const MIN_FIT_FONT = 14;
const PREFS_KEY = "pyesa-viewer-prefs";
// Used only for songs with no recorded length. Matches the old fixed rate of
// one pixel every 50ms, which is all this viewer used to do.
const FALLBACK_PX_PER_SEC = 20;
// Safari puts a floating close button in the top-left corner of any element it
// takes natively fullscreen, right where the title sits. Clear it.
const NATIVE_FS_GUTTER = 64;
// A pedal "page" leaves this much of the previous screen visible for context
const PAGE_STEP_RATIO = 0.85;

// Launched from the home screen there is no browser chrome to hide, so native
// fullscreen would only add Safari's close button on top of our own overlay.
function isStandalone() {
  try {
    return (
      window.navigator.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches
    );
  } catch {
    return false;
  }
}

// Viewer preferences outlive the session; a private window or blocked storage
// just falls back to the defaults.
function loadPrefs() {
  const defaults = { lyricsOnly: true, fontSize: 16, pedal: DEFAULT_PEDAL };
  try {
    const stored = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    const keys = (v, fallback) =>
      Array.isArray(v) && v.length > 0 && v.every((k) => typeof k === "string")
        ? v
        : fallback;
    return {
      lyricsOnly:
        typeof stored.lyricsOnly === "boolean"
          ? stored.lyricsOnly
          : defaults.lyricsOnly,
      fontSize: Number.isFinite(stored.fontSize)
        ? Math.min(MAX_FONT, Math.max(MIN_FONT, stored.fontSize))
        : defaults.fontSize,
      pedal: {
        mode: stored.pedal?.mode === "song" ? "song" : "page",
        forward: keys(stored.pedal?.forward, DEFAULT_PEDAL.forward),
        back: keys(stored.pedal?.back, DEFAULT_PEDAL.back),
      },
    };
  } catch {
    return defaults;
  }
}

// Distance to scroll before the last lyric line is on screen. Stops short of
// the video embed below the lyrics, which is not part of the song.
function lyricsTravel(box) {
  const content = box.querySelector(".song-content");
  if (!content) return Math.max(0, box.scrollHeight - box.clientHeight);
  const end =
    content.getBoundingClientRect().bottom -
    box.getBoundingClientRect().top +
    box.scrollTop;
  return Math.max(0, Math.round(end) - box.clientHeight);
}

function isTypingTarget(el) {
  return (
    !!el &&
    (el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.tagName === "SELECT" ||
      el.isContentEditable)
  );
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
  // The remembered size for normal reading. Fullscreen never writes to it:
  // there the size is auto-fitted, or fsFontSize if the user nudged it.
  const [fontSize, setFontSize] = useState(() => loadPrefs().fontSize);
  const [pedal, setPedal] = useState(() => loadPrefs().pedal);
  const [fsFontSize, setFsFontSize] = useState(null);
  const [fitSize, setFitSize] = useState(null);
  const [autoScroll, setAutoScroll] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [nativeFs, setNativeFs] = useState(false);
  const [wakeLockHeld, setWakeLockHeld] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Which pedal direction is waiting for a key press, if any
  const [learning, setLearning] = useState(null);
  const contentRef = useRef(null);
  const containerRef = useRef(null);
  const scrollRafRef = useRef(0);
  const touchStart = useRef(null);
  const wakeLockRef = useRef(null);
  const keyHandlerRef = useRef(null);

  const parsed = useMemo(() => parseSong(song?.content), [song?.content]);

  // Fullscreen auto-fits until the user takes over with +/-; "Fit" hands back
  const autoFit = fullscreen && fsFontSize === null;
  const displaySize = fullscreen
    ? (fsFontSize ?? fitSize ?? fontSize)
    : fontSize;

  useEffect(() => {
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ lyricsOnly, fontSize, pedal }),
      );
    } catch {
      // storage unavailable - preferences stay session-only
    }
  }, [lyricsOnly, fontSize, pedal]);

  // Reset scroll on song change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    setAutoScroll(false);
  }, [song?.Id]);

  // SongbookPro records a length per song (Duration2, seconds); when we have
  // one, spread the scroll across it so the text tracks the music. A fixed
  // pixel rate cannot: enlarging the font makes the same song take longer.
  const scrollSeconds = Number(song?.Duration2) > 0 ? Number(song.Duration2) : 0;

  useEffect(() => {
    if (!autoScroll) return;
    const box = contentRef.current;
    if (!box) return;

    let last = performance.now();
    let position = box.scrollTop;

    const tick = (now) => {
      const elapsed = (now - last) / 1000;
      last = now;

      const travel = lyricsTravel(box);
      if (travel <= 0) {
        setAutoScroll(false);
        return;
      }

      // A manual scroll or pedal page mid-song takes over rather than
      // fighting the animation
      if (Math.abs(box.scrollTop - position) > 2) position = box.scrollTop;

      // Recomputed every frame so a font change mid-scroll re-paces itself
      const pxPerSec = scrollSeconds
        ? travel / scrollSeconds
        : FALLBACK_PX_PER_SEC;

      position = Math.min(position + pxPerSec * elapsed, travel);
      box.scrollTop = position;

      if (position >= travel) {
        setAutoScroll(false);
        return;
      }
      scrollRafRef.current = requestAnimationFrame(tick);
    };

    scrollRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(scrollRafRef.current);
  }, [autoScroll, scrollSeconds]);

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
    if (!autoFit) return;
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
  }, [autoFit, fitFontSize, song?.Id, lyricsOnly]);

  // Keep the screen awake while performing. Safari only grants this inside a
  // user gesture, so the first request is fired straight from the toggle
  // handler rather than from an effect.
  const acquireWakeLock = useCallback(async () => {
    // No API means no secure context - plain http over a LAN address has none.
    // Served over https it is available from Safari 16.4 on.
    if (!navigator.wakeLock) {
      setWakeLockHeld(false);
      return;
    }
    try {
      const lock = await navigator.wakeLock.request("screen");
      wakeLockRef.current = lock;
      setWakeLockHeld(true);
      lock.addEventListener?.("release", () => {
        if (wakeLockRef.current === lock) {
          wakeLockRef.current = null;
          setWakeLockHeld(false);
        }
      });
    } catch {
      setWakeLockHeld(false);
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    const lock = wakeLockRef.current;
    wakeLockRef.current = null;
    setWakeLockHeld(false);
    lock?.release?.().catch(() => {});
  }, []);

  // Fullscreen: CSS overlay always, native Fullscreen API when it buys
  // something (a browser tab). iOS Safari on iPhone has no
  // Element.requestFullscreen at all, so the overlay is the fallback there.
  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    setFullscreen(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (fullscreen) {
      exitFullscreen();
      return;
    }
    if (!isStandalone()) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    }
    acquireWakeLock();
    // The button that was just tapped keeps focus, and a pedal sending Space
    // or Enter would "click" it again and drop straight back out.
    document.activeElement?.blur?.();
    setFsFontSize(null);
    setFullscreen(true);
  }, [fullscreen, exitFullscreen, acquireWakeLock]);

  // Leaving native fullscreen (Esc, browser gesture) drops the overlay too
  useEffect(() => {
    const onChange = () => {
      const active = !!document.fullscreenElement;
      setNativeFs(active);
      if (!active) setFullscreen(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // iOS drops the lock whenever the page is backgrounded, so take it again on
  // the way back, and let it go as soon as fullscreen ends.
  useEffect(() => {
    if (!fullscreen) {
      releaseWakeLock();
      return;
    }
    const onVisibility = () => {
      if (document.visibilityState === "visible" && !wakeLockRef.current) {
        acquireWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      releaseWakeLock();
    };
  }, [fullscreen, acquireWakeLock, releaseWakeLock]);

  // Never leave the browser stuck in native fullscreen if the viewer unmounts
  useEffect(
    () => () => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    },
    [],
  );

  const stepFont = useCallback(
    (delta) => {
      const next = Math.min(MAX_FONT, Math.max(MIN_FONT, displaySize + delta));
      if (fullscreen) setFsFontSize(next);
      else setFontSize(next);
    },
    [displaySize, fullscreen],
  );

  const scrollToTop = useCallback(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Pedal "forward": one screen down, and past the last line on to the next
  // song - or straight to the next song, depending on the chosen mode.
  const pedalForward = useCallback(() => {
    const box = contentRef.current;
    if (pedal.mode === "song" || !box) {
      onNext?.();
      return;
    }
    if (box.scrollTop >= lyricsTravel(box) - 2) {
      onNext?.();
      return;
    }
    box.scrollBy({
      top: Math.max(40, Math.round(box.clientHeight * PAGE_STEP_RATIO)),
      behavior: "smooth",
    });
  }, [pedal.mode, onNext]);

  const pedalBack = useCallback(() => {
    const box = contentRef.current;
    if (pedal.mode === "song" || !box) {
      onPrevious?.();
      return;
    }
    if (box.scrollTop <= 0) {
      onPrevious?.();
      return;
    }
    box.scrollBy({
      top: -Math.max(40, Math.round(box.clientHeight * PAGE_STEP_RATIO)),
      behavior: "smooth",
    });
  }, [pedal.mode, onPrevious]);

  // Pages render this viewer twice (a desktop and a mobile copy, one hidden),
  // and a modal can stack a third on top. Only the copy the user can actually
  // see - the one under the middle of its own box - may act on a key press.
  const isTopmostViewer = useCallback(() => {
    const el = containerRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const hit = document.elementFromPoint(
      r.left + r.width / 2,
      r.top + Math.min(r.height / 2, r.height - 1),
    );
    return !!hit && el.contains(hit);
  }, []);

  // One handler for pedal keys, shortcuts and Esc. Kept in a ref so the
  // window listener is registered once and always sees the latest state.
  keyHandlerRef.current = (e) => {
    if (e.defaultPrevented || isTypingTarget(e.target)) return;

    // Learning mode captures whatever the pedal sends, wherever focus is
    if (learning) {
      e.preventDefault();
      if (e.key === "Escape") {
        setLearning(null);
        return;
      }
      const key =
        e.key === "Unidentified" || e.key === "Dead" ? e.code : e.key;
      if (!key) return;
      setPedal((p) => ({ ...p, [learning]: [key] }));
      setLearning(null);
      return;
    }

    if (!isTopmostViewer()) return;

    if (e.key === "Escape") {
      if (settingsOpen) {
        e.preventDefault();
        setSettingsOpen(false);
      } else if (fullscreen) {
        e.preventDefault();
        exitFullscreen();
      }
      return;
    }

    const matches = (keys) => keys.includes(e.key) || keys.includes(e.code);
    if (matches(pedal.forward) || matches(pedal.back)) {
      // Stop the browser scrolling the page or activating a focused button;
      // a held pedal auto-repeats, and repeats must not race through songs.
      e.preventDefault();
      document.activeElement?.blur?.();
      if (e.repeat) return;
      if (matches(pedal.forward)) pedalForward();
      else pedalBack();
      return;
    }

    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    switch (e.key) {
      case "f":
      case "F":
        e.preventDefault();
        toggleFullscreen();
        break;
      case "s":
      case "S":
        e.preventDefault();
        setAutoScroll((v) => !v);
        break;
      case "c":
      case "C":
        e.preventDefault();
        setLyricsOnly((v) => !v);
        break;
      case "+":
      case "=":
        e.preventDefault();
        stepFont(2);
        break;
      case "-":
      case "_":
        e.preventDefault();
        stepFont(-2);
        break;
      case "Home":
        e.preventDefault();
        scrollToTop();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const onKey = (e) => keyHandlerRef.current?.(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Touch swipe for navigation. Only a clearly horizontal gesture counts: a
  // finger scrolling the lyrics drifts sideways too, and that must never flip
  // to another song mid-verse.
  const handleTouchStart = useCallback((e) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      const dx = start.x - t.clientX;
      const dy = start.y - t.clientY;
      if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 2) return;
      if (dx > 0) onNext?.();
      else onPrevious?.();
    },
    [onNext, onPrevious],
  );

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

  const iconButton = (active) =>
    `p-1.5 rounded-lg transition-colors ${
      active
        ? "bg-blue text-base"
        : "bg-surface text-subtext hover:bg-surface-hover"
    }`;

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
        style={
          fullscreen && nativeFs
            ? { paddingLeft: NATIVE_FS_GUTTER }
            : undefined
        }
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
              onClick={() => stepFont(-2)}
              disabled={displaySize <= MIN_FONT}
              aria-label="Smaller text"
              className="p-1.5 text-subtext hover:text-text disabled:opacity-30 transition-colors"
            >
              <FiMinus size={14} />
            </button>
            <span className="text-xs text-subtext w-6 text-center">
              {displaySize}
            </span>
            <button
              onClick={() => stepFont(2)}
              disabled={displaySize >= MAX_FONT}
              aria-label="Larger text"
              className="p-1.5 text-subtext hover:text-text disabled:opacity-30 transition-colors"
            >
              <FiPlus size={14} />
            </button>
          </div>

          {fullscreen && fsFontSize !== null && (
            <button
              onClick={() => setFsFontSize(null)}
              title="Back to automatic size"
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-surface text-subtext hover:bg-surface-hover transition-colors"
            >
              Fit
            </button>
          )}

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
              autoScroll
                ? "bg-green text-base"
                : "bg-surface text-subtext hover:bg-surface-hover"
            }`}
            title={
              scrollSeconds
                ? `Auto-scroll over ${scrollSeconds}s (song length)`
                : "Auto-scroll (no length recorded for this song)"
            }
          >
            {autoScroll ? <FiPause size={12} /> : <FiPlay size={12} />}
            <span className="hidden sm:inline">Scroll</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className={iconButton(fullscreen)}
            title={
              fullscreen
                ? wakeLockHeld
                  ? "Exit fullscreen (screen staying awake)"
                  : "Exit fullscreen (screen may sleep - needs https)"
                : "Fullscreen"
            }
            aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {fullscreen ? <FiMinimize size={14} /> : <FiMaximize size={14} />}
          </button>

          <button
            onClick={scrollToTop}
            className={iconButton(false)}
            title="Scroll to top"
            aria-label="Scroll to top"
          >
            <FiArrowUp size={14} />
          </button>

          <button
            onClick={() => {
              setSettingsOpen((v) => !v);
              setLearning(null);
            }}
            className={iconButton(settingsOpen)}
            title="Foot pedal & keyboard"
            aria-label="Foot pedal and keyboard settings"
          >
            <FiSettings size={14} />
          </button>
        </div>

        {settingsOpen && (
          <ViewerSettings
            pedal={pedal}
            onChange={setPedal}
            learning={learning}
            onLearn={setLearning}
            onClose={() => {
              setSettingsOpen(false);
              setLearning(null);
            }}
          />
        )}
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
