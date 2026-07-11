import { useState, useEffect } from "react";
import { FiX, FiSunrise } from "react-icons/fi";
import { getSongBySlug } from "../db/index";
import { extractSalmoTemplate, buildSalmoContent } from "../lib/salmo";

/**
 * Quick-add for the weekly responsorial psalm (Salmo): the lyrics change
 * every Sunday but the chords stay the same. Takes the two lyric lines,
 * applies the chord pattern from the library's "Salmo" song, and shows a
 * live preview of the generated ChordPro.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onSave: ({ name, content }) => Promise (parent creates the song)
 *  - defaultName: string (e.g. "Salmo - 2026-07-19")
 */
export default function SalmoModal({ open, onClose, onSave, defaultName }) {
  const [name, setName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [template, setTemplate] = useState({ intro: "", chordLines: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(defaultName || "Salmo");
      setLine1("");
      setLine2("");
      setSaving(false);
      setError("");
      // Chord pattern comes from the library's "Salmo" song, so updating
      // that song in SongbookPro updates the template automatically.
      getSongBySlug("salmo").then((song) => {
        setTemplate(
          song
            ? extractSalmoTemplate(song.content)
            : { intro: "", chordLines: [] },
        );
      });
    }
  }, [open, defaultName]);

  if (!open) return null;

  const content = buildSalmoContent(template, [line1, line2]);
  const canSave = name.trim() && line1.trim() && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      await onSave({ name: name.trim(), content });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const field =
    "w-full px-3 py-2.5 bg-surface text-text placeholder:text-overlay rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue/30 transition-all";

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end md:items-center md:justify-center">
      <div className="bg-base w-full md:max-w-md md:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden shadow-2xl max-h-[90dvh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface">
          <h3 className="font-bold flex items-center gap-2">
            <FiSunrise size={16} className="text-lavender" />
            Add This Week&apos;s Salmo
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3 overflow-y-auto">
          <p className="text-xs text-subtext">
            Type the two lines of this Sunday&apos;s psalm response — the
            usual Salmo chords are applied automatically.
          </p>
          <div>
            <label className="text-xs font-medium text-subtext block mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-subtext block mb-1">
              Line 1 *
            </label>
            <input
              type="text"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="e.g. Panginoo'y aking tanglaw,"
              className={field}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-subtext block mb-1">
              Line 2
            </label>
            <input
              type="text"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              placeholder="e.g. siya'ng aking kaligtasan."
              className={field}
            />
          </div>

          {line1.trim() && (
            <div>
              <p className="text-xs font-medium text-subtext mb-1">Preview</p>
              <pre className="text-xs font-mono bg-surface rounded-xl p-3 whitespace-pre-wrap overflow-x-auto">
                {content}
              </pre>
            </div>
          )}

          {error && <p className="text-xs text-red">{error}</p>}
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full py-2.5 bg-lavender text-base text-sm font-semibold rounded-xl disabled:opacity-40 transition-opacity"
          >
            {saving ? "Saving..." : "Add to Set"}
          </button>
        </div>
      </div>
    </div>
  );
}
