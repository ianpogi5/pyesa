import { FiX } from "react-icons/fi";
import SongViewer from "./SongViewer";

/**
 * Read-only song preview overlay (used in the set builder to check a
 * song already in the draft).
 *
 * Props:
 *  - song: song object or null (closed when null)
 *  - onClose: () => void
 */
export default function SongPreviewModal({ song, onClose }) {
  if (!song) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end md:items-center md:justify-center">
      <div className="bg-base w-full h-[85dvh] md:h-[80vh] md:max-w-lg md:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-end px-4 py-2 border-b border-surface">
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="p-1.5 rounded-lg hover:bg-surface transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <SongViewer song={song} />
        </div>
      </div>
    </div>
  );
}
