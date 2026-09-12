import { FiX, FiRotateCcw } from "react-icons/fi";
import { DEFAULT_PEDAL, keyLabel } from "../lib/pedal";

export default function ViewerSettings({
  pedal,
  onChange,
  learning,
  onLearn,
  onClose,
}) {
  const setMode = (mode) => onChange({ ...pedal, mode });
  const reset = (dir) => onChange({ ...pedal, [dir]: DEFAULT_PEDAL[dir] });

  const KeyRow = ({ dir, label }) => (
    <div className="flex items-center gap-2 py-1.5">
      <span className="w-16 text-xs text-subtext">{label}</span>
      <div className="flex-1 flex flex-wrap gap-1 min-w-0">
        {learning === dir ? (
          <span className="text-xs font-medium text-blue animate-pulse">
            Press the pedal now… (Esc cancels)
          </span>
        ) : (
          pedal[dir].map((k) => (
            <kbd
              key={k}
              className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface text-text"
            >
              {keyLabel(k)}
            </kbd>
          ))
        )}
      </div>
      <button
        onClick={() => onLearn(learning === dir ? null : dir)}
        className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
          learning === dir
            ? "bg-blue text-base"
            : "bg-surface text-subtext hover:bg-surface-hover"
        }`}
      >
        {learning === dir ? "Cancel" : "Learn"}
      </button>
      <button
        onClick={() => reset(dir)}
        title="Restore defaults"
        aria-label={`Reset ${label.toLowerCase()} keys`}
        className="p-1 rounded-lg text-subtext hover:bg-surface transition-colors"
      >
        <FiRotateCcw size={12} />
      </button>
    </div>
  );

  return (
    <div
      className="mt-2 rounded-xl border border-surface bg-base px-3 py-2.5 text-sm"
      data-testid="viewer-settings"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wide text-subtext">
          Foot pedal &amp; keyboard
        </h3>
        <button
          onClick={onClose}
          aria-label="Close settings"
          className="p-1 rounded-lg text-subtext hover:bg-surface transition-colors"
        >
          <FiX size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <span className="w-16 text-xs text-subtext">Pedal</span>
        <div className="flex bg-surface rounded-lg p-0.5">
          {[
            ["page", "Page, then next song"],
            ["song", "Next / previous song"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                pedal.mode === value
                  ? "bg-blue text-base"
                  : "text-subtext hover:text-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <KeyRow dir="forward" label="Forward" />
      <KeyRow dir="back" label="Back" />

      <p className="text-[11px] text-overlay mt-1.5 leading-snug">
        Keyboard: <kbd className="font-mono">F</kbd> fullscreen ·{" "}
        <kbd className="font-mono">S</kbd> auto-scroll ·{" "}
        <kbd className="font-mono">C</kbd> chords ·{" "}
        <kbd className="font-mono">+</kbd>/<kbd className="font-mono">−</kbd>{" "}
        size · <kbd className="font-mono">Home</kbd> top ·{" "}
        <kbd className="font-mono">Esc</kbd> exit
      </p>
    </div>
  );
}
