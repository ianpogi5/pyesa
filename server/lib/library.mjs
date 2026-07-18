import { toSlug } from "./slug.mjs";

/**
 * Merge songs into an existing library array, deduplicating by slug.
 * An incoming song replaces an existing one only if its ModifiedDateTime
 * is newer (ISO strings compare lexically). Returns a new sorted array,
 * counts of what changed, and the added/updated songs themselves.
 */
export function mergeSongsIntoLibrary(existing, incoming) {
  const bySlug = new Map();
  for (const song of existing) {
    const slug = song.slug || toSlug(song.name);
    bySlug.set(slug, { ...song, slug });
  }

  let added = 0;
  let updated = 0;
  const changed = [];
  for (const song of incoming) {
    if (song.Deleted) continue;
    const slug = toSlug(song.name);
    const current = bySlug.get(slug);
    const stored = { ...song, slug };
    if (!current) {
      bySlug.set(slug, stored);
      changed.push(stored);
      added++;
    } else if (
      (song.ModifiedDateTime || "") > (current.ModifiedDateTime || "") &&
      song.hash !== current.hash
    ) {
      bySlug.set(slug, stored);
      changed.push(stored);
      updated++;
    }
  }

  const songs = [...bySlug.values()].sort((a, b) =>
    (a.name || "").localeCompare(b.name || ""),
  );
  return { songs, added, updated, changed };
}
