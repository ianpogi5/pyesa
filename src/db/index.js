import { openDB } from "idb";

const DB_NAME = "pyesa-db";
const DB_VERSION = 1;

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("songs")) {
          const songStore = db.createObjectStore("songs", { keyPath: "Id" });
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
 * Save an array of songs to IndexedDB. Deduplicates by song Id.
 */
export async function saveSongs(songs) {
  const db = await getDb();
  const tx = db.transaction("songs", "readwrite");
  for (const song of songs) {
    await tx.store.put(song);
  }
  await tx.done;
}

/**
 * Get a single song by its Id.
 */
export async function getSongById(id) {
  const db = await getDb();
  return db.get("songs", id);
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
