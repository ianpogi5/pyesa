import { useState, useEffect } from "react";
import { FiX, FiFilePlus } from "react-icons/fi";

/**
 * Modal for adding a placeholder — a song that isn't in the library yet
 * and needs to be encoded in SongbookPro. Captures name, album, artist.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onSave: ({ name, album, artist }) => void
 */
export default function PlaceholderModal({ open, onClose, onSave }) {
  const [name, setName] = useState("");
  const [album, setAlbum] = useState("");
  const [artist, setArtist] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setAlbum("");
      setArtist("");
    }
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), album: album.trim(), artist: artist.trim() });
  };

  const field =
    "w-full px-3 py-2.5 bg-surface text-text placeholder:text-overlay rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue/30 transition-all";

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end md:items-center md:justify-center">
      <div className="bg-base w-full md:max-w-md md:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface">
          <h3 className="font-bold flex items-center gap-2">
            <FiFilePlus size={16} className="text-peach" />
            Add Missing Song
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs text-subtext">
            This song isn&apos;t in the library yet. It will be marked as
            needing encoding — fill in what you know so the right song gets
            added.
          </p>
          <div>
            <label className="text-xs font-medium text-subtext block mb-1">
              Song name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tinapay ng Buhay"
              className={field}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-subtext block mb-1">
              Album
            </label>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              placeholder="Optional"
              className={field}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-subtext block mb-1">
              Artist
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Optional"
              className={field}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="mt-1 w-full py-2.5 bg-peach text-base text-sm font-semibold rounded-xl disabled:opacity-40 transition-opacity"
          >
            Add Placeholder
          </button>
        </div>
      </div>
    </div>
  );
}
