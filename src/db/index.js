import { openDB } from "idb";

const DB_NAME = "pyesa-db";
const DB_VERSION = 2;

let dbPromise = null;
let needsSongRebuild = false;

/**
 * Generate a stable slug from a song name for deduplication.
 * The same song appearing in different sets will produce the same slug.
 */
export function toSlug(name) {
  return (name || "untitled")
    .trim()
    .toLowerCase()
    .replace(/[\s/\\]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // v1 → v2: switch songs keyPath from Id to slug for deduplication
        if (oldVersion < 2 && db.objectStoreNames.contains("songs")) {
          db.deleteObjectStore("songs");
          needsSongRebuild = true;
        }
        if (!db.objectStoreNames.contains("songs")) {
          const songStore = db.createObjectStore("songs", { keyPath: "slug" });
          songStore.createIndex("name", "name");
          songStore.createIndex("author", "author");
        }
        if (!db.objectStoreNames.contains("sets")) {
          db.createObjectStore("sets", { keyPath: "filename" });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * After a v1→v2 upgrade, rebuild the songs store from cached sets.
 * Should be called once on app startup.
 */
export async function rebuildSongsIfNeeded() {
  await getDb(); // ensure upgrade ran
  if (!needsSongRebuild) return false;
  needsSongRebuild = false;
  const sets = await getAllSets();
  for (const set of sets) {
    if (set.songs && set.songs.length > 0) {
      await saveSongs(set.songs);
    }
  }
  return true;
}

/**
 * Save an array of songs to IndexedDB. Deduplicates by song name (slug).
 */
export async function saveSongs(songs) {
  const db = await getDb();
  const tx = db.transaction("songs", "readwrite");
  for (const song of songs) {
    const slug = toSlug(song.name);
    await tx.store.put({ ...song, slug });
  }
  await tx.done;
}

/**
 * Get a single song by its slug.
 */
export async function getSongBySlug(slug) {
  const db = await getDb();
  return db.get("songs", slug);
}

/**
 * Get all songs from the database.
 */
export async function getAllSongs() {
  const db = await getDb();
  return db.getAll("songs");
}

/**
 * Search songs by name, author, or subtitle.
 * Simple client-side filter.
 */
export async function searchSongs(query) {
  const all = await getAllSongs();
  if (!query || !query.trim()) return all;
  const q = query.toLowerCase().trim();
  return all.filter(
    (s) =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.author && s.author.toLowerCase().includes(q)) ||
      (s.subTitle && s.subTitle.toLowerCase().includes(q)) ||
      (s.DeepSearch && s.DeepSearch.toLowerCase().includes(q)),
  );
}

/**
 * Save a set (filename + songs array) to IndexedDB.
 */
export async function saveSet(filename, songs) {
  const db = await getDb();
  await db.put("sets", { filename, songs, savedAt: new Date().toISOString() });
  // Also save individual songs to the songs store
  await saveSongs(songs);
}

/**
 * Get a set by filename.
 */
export async function getSet(filename) {
  const db = await getDb();
  return db.get("sets", filename);
}

/**
 * Get all saved sets.
 */
export async function getAllSets() {
  const db = await getDb();
  return db.getAll("sets");
}

/**
 * Get total song count.
 */
export async function getSongCount() {
  const db = await getDb();
  return db.count("songs");
}
