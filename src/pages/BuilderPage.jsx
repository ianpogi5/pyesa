import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import EmptyState from "../components/EmptyState";
import SongSelectModal from "../components/SongSelectModal";
import PlaceholderModal from "../components/PlaceholderModal";
import SalmoModal from "../components/SalmoModal";
import SongPreviewModal from "../components/SongPreviewModal";
import { api, getPasscode, setPasscode, clearPasscode } from "../api";
import { seedLibraryFromServer, getSongBySlug, saveSongs } from "../db/index";
import { buildShareImageBlob } from "../lib/shareImage";
import { suggestSetName } from "../lib/liturgy";
import {
  FiLock,
  FiPlus,
  FiEdit3,
  FiLoader,
  FiTrash2,
  FiArrowUp,
  FiArrowDown,
  FiX,
  FiMusic,
  FiFilePlus,
  FiUploadCloud,
  FiCheckCircle,
  FiAlertTriangle,
  FiLink,
  FiSunrise,
  FiRefreshCw,
} from "react-icons/fi";

function nextSundayISO() {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function songItemFrom(song) {
  return {
    type: "song",
    slug: song.slug,
    name: song.name,
    author: song.author || "",
    subTitle: song.subTitle || "",
  };
}

// ---------------------------------------------------------------- Unlock

function UnlockForm({ onUnlocked }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setError("");
    setPasscode(code.trim());
    try {
      await api.checkAuth();
      onUnlocked();
    } catch (err) {
      clearPasscode();
      setError(
        err.status === 401
          ? "Wrong passcode. Try again."
          : "Can't reach the server. Check your connection.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-xs text-center">
        <FiLock size={28} className="mx-auto text-overlay mb-3" />
        <h2 className="text-lg font-bold mb-1">Set Builder</h2>
        <p className="text-sm text-subtext mb-4">
          Enter the choir passcode to create and edit sets.
        </p>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Passcode"
          autoFocus
          className="w-full px-3 py-2.5 bg-surface text-text placeholder:text-overlay rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue/30 text-center"
        />
        {error && <p className="text-xs text-red mt-2">{error}</p>}
        <button
          type="submit"
          disabled={!code.trim() || busy}
          className="mt-3 w-full py-2.5 bg-blue text-base text-sm font-semibold rounded-xl disabled:opacity-40"
        >
          {busy ? "Checking..." : "Unlock"}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------- Drafts list

function DraftsList({ drafts, loading, onOpen, onCreate, onUpload, uploadResult, uploading }) {
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState(nextSundayISO());
  const [creating, setCreating] = useState(false);
  const fileRef = useRef(null);
  const suggestionRef = useRef("");

  // Prefill the name from the liturgical calendar for the picked date;
  // never clobber something the user typed themselves
  useEffect(() => {
    if (!showNew) return;
    let cancelled = false;
    suggestSetName(date)
      .then((suggestion) => {
        if (cancelled || !suggestion) return;
        setName((current) =>
          current === "" || current === suggestionRef.current
            ? suggestion
            : current,
        );
        suggestionRef.current = suggestion;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [showNew, date]);

  const create = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      await onCreate(name.trim(), date);
    } finally {
      setCreating(false);
    }
  };

  const active = drafts.filter((d) => d.status === "active");
  const finalized = drafts.filter((d) => d.status === "finalized");

  const field =
    "w-full px-3 py-2.5 bg-surface text-text placeholder:text-overlay rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue/30";

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-surface flex gap-2">
        <button
          onClick={() => setShowNew(!showNew)}
          className="flex-1 flex items-center justify-center gap-2 text-xs font-medium text-blue px-3 py-2 bg-blue/10 rounded-lg hover:bg-blue/20 transition-colors"
        >
          <FiPlus size={14} />
          New Set
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex-1 flex items-center justify-center gap-2 text-xs font-medium text-teal px-3 py-2 bg-teal/10 rounded-lg hover:bg-teal/20 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <FiLoader size={14} className="animate-spin" />
          ) : (
            <FiUploadCloud size={14} />
          )}
          Upload .sbp
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".sbp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onUpload(file);
          }}
        />
      </div>

      {uploadResult && (
        <div
          className={`mx-3 mt-2 px-3 py-2 rounded-lg text-xs ${
            uploadResult.error ? "bg-red/10 text-red" : "bg-teal/10 text-teal"
          }`}
        >
          {uploadResult.error ? (
            uploadResult.error
          ) : (
            <>
              <p className="font-semibold">
                {uploadResult.songsAdded} song
                {uploadResult.songsAdded !== 1 ? "s" : ""} added
                {uploadResult.songsUpdated > 0 &&
                  `, ${uploadResult.songsUpdated} updated`}{" "}
                ({uploadResult.totalSongs} total)
              </p>
              {uploadResult.placeholdersResolved.map((r, i) => (
                <p key={i}>
                  ✓ &ldquo;{r.placeholder}&rdquo; resolved in {r.draft}
                </p>
              ))}
            </>
          )}
        </div>
      )}

      {showNew && (
        <div className="px-3 py-3 border-b border-surface flex flex-col gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Set name, e.g. 16th Sunday in Ordinary Time"
            className={field}
            autoFocus
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={field}
          />
          <button
            onClick={create}
            disabled={!name.trim() || creating}
            className="w-full py-2.5 bg-blue text-base text-sm font-semibold rounded-xl disabled:opacity-40"
          >
            {creating ? "Creating..." : "Create Set"}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FiLoader size={20} className="animate-spin text-overlay" />
          </div>
        ) : drafts.length === 0 ? (
          <EmptyState
            icon={FiEdit3}
            title="No sets in progress"
            message="Tap New Set to start building next week's songs."
          />
        ) : (
          <>
            {active.map((draft) => {
              const placeholders = draft.items.filter(
                (i) => i.type === "placeholder",
              ).length;
              return (
                <button
                  key={draft.id}
                  onClick={() => onOpen(draft)}
                  className="w-full text-left px-4 py-3 border-b border-surface/50 hover:bg-surface/50 active:bg-surface transition-colors"
                >
                  <p className="text-sm font-medium">{draft.name}</p>
                  <p className="text-xs text-subtext mt-0.5">
                    {draft.date} · {draft.items.length} song
                    {draft.items.length !== 1 ? "s" : ""}
                    {placeholders > 0 && (
                      <span className="text-peach">
                        {" "}
                        · {placeholders} need{placeholders === 1 ? "s" : ""}{" "}
                        encoding
                      </span>
                    )}
                  </p>
                </button>
              );
            })}
            {finalized.length > 0 && (
              <>
                <div className="px-4 pt-4 pb-1">
                  <p className="text-[10px] font-semibold text-overlay uppercase tracking-wider">
                    Finalized
                  </p>
                </div>
                {finalized.map((draft) => (
                  <button
                    key={draft.id}
                    onClick={() => onOpen(draft)}
                    className="w-full text-left px-4 py-3 border-b border-surface/50 hover:bg-surface/50 transition-colors opacity-70"
                  >
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <FiCheckCircle size={12} className="text-green" />
                      {draft.name}
                    </p>
                    <p className="text-xs text-subtext mt-0.5">{draft.date}</p>
                  </button>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Draft editor

function DraftEditor({ draftId, onDeleted, onFinalized }) {
  const [draft, setDraft] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [saveState, setSaveState] = useState("saved"); // saved | saving | error
  const [pickerOpen, setPickerOpen] = useState(false);
  const [placeholderOpen, setPlaceholderOpen] = useState(false);
  const [salmoOpen, setSalmoOpen] = useState(false);
  const [previewSong, setPreviewSong] = useState(null);
  const [resolveIndex, setResolveIndex] = useState(null); // placeholder being resolved
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState("");
  const versionRef = useRef(0);
  const backupKey = `pyesa-draft-backup-${draftId}`;

  // Load draft, preferring a newer local crash backup
  useEffect(() => {
    let cancelled = false;
    api
      .getDraft(draftId)
      .then((server) => {
        if (cancelled) return;
        let restored = server;
        try {
          const backup = JSON.parse(localStorage.getItem(backupKey));
          if (backup && backup.updatedAt > server.updatedAt) {
            restored = backup;
            versionRef.current++;
          }
        } catch {
          // no valid backup
        }
        setDraft(restored);
      })
      .catch(() => !cancelled && setNotFound(true));
    return () => {
      cancelled = true;
    };
  }, [draftId, backupKey]);

  const editable = draft && draft.status === "active";

  const applyChange = useCallback(
    (changes) => {
      versionRef.current++;
      setDraft((d) => {
        const next = { ...d, ...changes, updatedAt: new Date().toISOString() };
        try {
          localStorage.setItem(backupKey, JSON.stringify(next));
        } catch {
          // storage full — autosave still covers us
        }
        return next;
      });
      setSaveState("saving");
    },
    [backupKey],
  );

  // Debounced autosave
  useEffect(() => {
    if (!draft || versionRef.current === 0) return;
    const version = versionRef.current;
    const timer = setTimeout(async () => {
      try {
        await api.updateDraft(draft.id, {
          name: draft.name,
          date: draft.date,
          items: draft.items,
        });
        if (versionRef.current === version) {
          localStorage.removeItem(backupKey);
          setSaveState("saved");
        }
      } catch {
        setSaveState("error");
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [draft, backupKey]);

  const moveItem = (index, delta) => {
    const items = [...draft.items];
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    applyChange({ items });
  };

  const removeItem = (index) => {
    applyChange({ items: draft.items.filter((_, i) => i !== index) });
  };

  const addSong = (song) => {
    setPickerOpen(false);
    if (resolveIndex !== null) {
      const items = [...draft.items];
      items[resolveIndex] = songItemFrom(song);
      setResolveIndex(null);
      applyChange({ items });
    } else {
      applyChange({ items: [...draft.items, songItemFrom(song)] });
    }
  };

  const addPlaceholder = (placeholder) => {
    setPlaceholderOpen(false);
    applyChange({
      items: [...draft.items, { type: "placeholder", ...placeholder }],
    });
  };

  const addSalmo = async ({ name, content }) => {
    const stored = await api.createSong({
      name,
      content,
      _tags: '["mass","tagalog","salmo"]',
    });
    await saveSongs([stored]); // make it previewable/searchable immediately
    setSalmoOpen(false);
    applyChange({ items: [...draft.items, songItemFrom(stored)] });
  };

  const openPreview = async (item) => {
    if (item.type !== "song") return;
    const song = await getSongBySlug(item.slug);
    setPreviewSong(
      song || {
        name: item.name,
        content: "Song content hasn't downloaded to this device yet.",
      },
    );
  };

  const handleReopen = async () => {
    if (
      !window.confirm(
        `Edit "${draft.name}"? The published set stays live until you publish again.`,
      )
    )
      return;
    const reopened = await api.reopenDraft(draft.id);
    versionRef.current = 0; // fresh baseline, nothing to autosave yet
    setDraft(reopened);
    onFinalized(); // refresh the drafts list status
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${draft.name}"? This can't be undone.`)) return;
    await api.deleteDraft(draft.id);
    localStorage.removeItem(backupKey);
    onDeleted();
  };

  const handleFinalize = async () => {
    if (
      !window.confirm(
        `Publish "${draft.name}"? It will appear in the app for everyone.`,
      )
    )
      return;
    setFinalizing(true);
    setFinalizeError("");
    try {
      const result = await api.finalizeDraft(draft.id);
      // Render the Messenger share card (og:image) and upload it.
      // Non-fatal: the share page works without it, just with no picture.
      try {
        const blob = await buildShareImageBlob({
          name: draft.name,
          date: draft.date,
          songs: draft.items.map((i) => i.name),
        });
        await api.uploadShareImage(draft.id, blob);
      } catch {
        // ignore — text-only share preview
      }
      setDraft((d) => ({ ...d, status: "finalized", ...result }));
      onFinalized();
    } catch (err) {
      setFinalizeError(err.message);
    } finally {
      setFinalizing(false);
    }
  };

  if (notFound) {
    return (
      <EmptyState
        icon={FiAlertTriangle}
        title="Draft not found"
        message="It may have been deleted on another device."
      />
    );
  }
  if (!draft) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiLoader size={20} className="animate-spin text-overlay" />
      </div>
    );
  }

  const placeholderCount = draft.items.filter(
    (i) => i.type === "placeholder",
  ).length;

  const field =
    "px-3 py-2 bg-surface text-text placeholder:text-overlay rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue/30";

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-20">
      {/* Meta */}
      <div className="px-4 pt-3 pb-2 border-b border-surface">
        {editable ? (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={draft.name}
              onChange={(e) => applyChange({ name: e.target.value })}
              className={`${field} font-semibold`}
            />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={draft.date}
                onChange={(e) => applyChange({ date: e.target.value })}
                className={field}
              />
              <span className="flex-1 text-right text-xs text-overlay">
                {saveState === "saving" && "Saving..."}
                {saveState === "saved" && "Saved"}
                {saveState === "error" && (
                  <span className="text-red">Save failed — keep editing to retry</span>
                )}
              </span>
              <button
                onClick={handleDelete}
                className="p-2 text-overlay hover:text-red transition-colors"
                title="Delete draft"
              >
                <FiTrash2 size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="font-bold flex items-center gap-2">
              <FiCheckCircle size={14} className="text-green" />
              {draft.name}
            </p>
            <p className="text-xs text-subtext mt-0.5">
              {draft.date} · Published
            </p>
            {draft.shareUrl && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(draft.shareUrl)}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue px-2.5 py-1.5 bg-blue/10 rounded-lg"
                >
                  <FiLink size={12} />
                  Copy share link
                </button>
                <a
                  href={`/sets/${encodeURIComponent(draft.filename)}`}
                  className="text-xs font-medium text-subtext px-2.5 py-1.5 bg-surface rounded-lg"
                >
                  View in app
                </a>
                <a
                  href={`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(draft.shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-teal px-2.5 py-1.5 bg-teal/10 rounded-lg"
                  title="If Messenger shows an outdated preview, press Scrape Again on Facebook's debugger"
                >
                  <FiRefreshCw size={12} />
                  Refresh FB preview
                </a>
                <button
                  onClick={handleReopen}
                  className="flex items-center gap-1.5 text-xs font-medium text-peach px-2.5 py-1.5 bg-peach/10 rounded-lg"
                  title="Reopen for editing — republish when done"
                >
                  <FiEdit3 size={12} />
                  Edit Set
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="flex-1">
        {draft.items.length === 0 ? (
          <EmptyState
            icon={FiMusic}
            title="No songs yet"
            message="Add songs from the library, or add a placeholder for songs that still need encoding."
          />
        ) : (
          draft.items.map((item, index) => (
            <div
              key={`${item.type}-${item.slug || item.name}-${index}`}
              className={`flex items-center gap-2 px-3 py-2.5 border-b border-surface/50 ${
                item.type === "placeholder" ? "bg-peach/5" : ""
              }`}
            >
              <span className="flex-none w-5 h-5 flex items-center justify-center rounded-full bg-surface text-[10px] font-bold text-subtext">
                {index + 1}
              </span>
              <button
                onClick={() => openPreview(item)}
                disabled={item.type !== "song"}
                className="flex-1 min-w-0 text-left"
              >
                <p
                  className={`text-sm font-medium leading-tight truncate ${
                    item.type === "placeholder" ? "text-peach" : ""
                  }`}
                >
                  {item.name}
                </p>
                <p className="text-xs text-subtext truncate mt-0.5">
                  {item.type === "placeholder" ? (
                    <>
                      Needs encoding
                      {item.album && ` · ${item.album}`}
                      {item.artist && ` · ${item.artist}`}
                    </>
                  ) : (
                    <>
                      {item.subTitle}
                      {item.subTitle && item.author && " · "}
                      {item.author}
                    </>
                  )}
                </p>
              </button>
              {editable && (
                <div className="flex-none flex items-center gap-0.5">
                  {item.type === "placeholder" && (
                    <button
                      onClick={() => {
                        setResolveIndex(index);
                        setPickerOpen(true);
                      }}
                      className="p-1.5 text-teal hover:bg-teal/10 rounded-lg transition-colors"
                      title="Replace with a library song"
                    >
                      <FiMusic size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    className="p-1.5 text-overlay hover:text-text disabled:opacity-20 transition-colors"
                  >
                    <FiArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => moveItem(index, 1)}
                    disabled={index === draft.items.length - 1}
                    className="p-1.5 text-overlay hover:text-text disabled:opacity-20 transition-colors"
                  >
                    <FiArrowDown size={14} />
                  </button>
                  <button
                    onClick={() => removeItem(index)}
                    className="p-1.5 text-overlay hover:text-red transition-colors"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Actions */}
      {editable && (
        <div className="px-4 py-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setResolveIndex(null);
                setPickerOpen(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-blue bg-blue/10 rounded-xl hover:bg-blue/20 transition-colors"
            >
              <FiPlus size={15} />
              Add Song
            </button>
            <button
              onClick={() => setPlaceholderOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-peach bg-peach/10 rounded-xl hover:bg-peach/20 transition-colors"
            >
              <FiFilePlus size={15} />
              Missing Song
            </button>
          </div>
          <button
            onClick={() => setSalmoOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-lavender bg-lavender/10 rounded-xl hover:bg-lavender/20 transition-colors"
          >
            <FiSunrise size={15} />
            This Week&apos;s Salmo
          </button>

          {placeholderCount > 0 ? (
            <p className="text-xs text-center text-peach py-1">
              {placeholderCount} song{placeholderCount !== 1 ? "s" : ""} still
              need{placeholderCount === 1 ? "s" : ""} encoding before this set
              can be published
            </p>
          ) : (
            draft.items.length > 0 && (
              <button
                onClick={handleFinalize}
                disabled={finalizing}
                className="w-full py-2.5 bg-green text-base text-sm font-semibold rounded-xl disabled:opacity-50"
              >
                {finalizing ? "Publishing..." : "Publish Set"}
              </button>
            )
          )}
          {finalizeError && (
            <p className="text-xs text-center text-red">{finalizeError}</p>
          )}
        </div>
      )}

      <SongSelectModal
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          setResolveIndex(null);
        }}
        onSelect={addSong}
        title={resolveIndex !== null ? "Replace Placeholder" : "Add a Song"}
      />
      <PlaceholderModal
        open={placeholderOpen}
        onClose={() => setPlaceholderOpen(false)}
        onSave={addPlaceholder}
      />
      <SalmoModal
        open={salmoOpen}
        onClose={() => setSalmoOpen(false)}
        onSave={addSalmo}
        defaultName={`Salmo - ${draft.date}`}
      />
      <SongPreviewModal
        song={previewSong}
        onClose={() => setPreviewSong(null)}
      />
    </div>
  );
}

// ---------------------------------------------------------------- Page

export default function BuilderPage() {
  const { draftId } = useParams();
  const navigate = useNavigate();

  const [auth, setAuth] = useState("checking"); // checking | locked | unlocked
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  useEffect(() => {
    if (!getPasscode()) {
      setAuth("locked");
      return;
    }
    api
      .checkAuth()
      .then(() => setAuth("unlocked"))
      .catch((err) => {
        if (err.status === 401) {
          clearPasscode();
          setAuth("locked");
        } else {
          // offline / server hiccup: let them in, individual calls will surface errors
          setAuth("unlocked");
        }
      });
  }, []);

  const refreshDrafts = useCallback(() => {
    setLoading(true);
    api
      .listDrafts()
      .then(setDrafts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (auth !== "unlocked") return;
    refreshDrafts();
    seedLibraryFromServer();
  }, [auth, refreshDrafts]);

  const handleCreate = async (name, date) => {
    const draft = await api.createDraft({ name, date, items: [] });
    setDrafts((d) => [draft, ...d]);
    navigate(`/builder/${draft.id}`);
  };

  const handleUpload = async (file) => {
    setUploading(true);
    setUploadResult(null);
    try {
      const result = await api.uploadSbp(file);
      setUploadResult(result);
      refreshDrafts();
      seedLibraryFromServer();
    } catch (err) {
      setUploadResult({ error: err.message });
    } finally {
      setUploading(false);
    }
  };

  const editorOpen = Boolean(draftId);
  const activeDraft = drafts.find((d) => d.id === draftId);

  if (auth !== "unlocked") {
    return (
      <Layout title="Set Builder">
        {auth === "checking" ? (
          <div className="flex items-center justify-center py-12">
            <FiLoader size={20} className="animate-spin text-overlay" />
          </div>
        ) : (
          <UnlockForm onUnlocked={() => setAuth("unlocked")} />
        )}
      </Layout>
    );
  }

  const sidebar = (
    <DraftsList
      drafts={drafts}
      loading={loading}
      onOpen={(draft) => navigate(`/builder/${draft.id}`)}
      onCreate={handleCreate}
      onUpload={handleUpload}
      uploadResult={uploadResult}
      uploading={uploading}
    />
  );

  return (
    <Layout
      title={editorOpen ? activeDraft?.name || "Edit Set" : "Set Builder"}
      showBack={editorOpen}
      onBack={() => {
        refreshDrafts();
        navigate("/builder");
      }}
    >
      <div className="flex h-full">
        {/* Drafts list: full-width on mobile (hidden while editing), sidebar on desktop */}
        <aside
          className={`${
            editorOpen ? "hidden md:flex" : "flex"
          } flex-col w-full pb-14 md:pb-0 md:w-80 lg:w-96 md:border-r md:border-surface md:bg-mantle h-full`}
        >
          {sidebar}
        </aside>

        <div
          className={`${
            editorOpen ? "flex" : "hidden md:flex"
          } flex-1 flex-col overflow-hidden`}
        >
          {editorOpen ? (
            <DraftEditor
              key={draftId}
              draftId={draftId}
              onDeleted={() => {
                refreshDrafts();
                navigate("/builder");
              }}
              onFinalized={refreshDrafts}
            />
          ) : (
            <EmptyState
              icon={FiEdit3}
              title="Select a set"
              message="Pick a draft from the sidebar or create a new one."
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
