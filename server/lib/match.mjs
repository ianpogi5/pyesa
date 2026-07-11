/**
 * Normalize a song title for placeholder matching: lowercase, strip
 * diacritics and curly quotes, drop punctuation, collapse whitespace.
 */
export function normalizeTitle(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[‘’]/g, "'")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Find a song in the library matching a placeholder. Only confident
 * matches count: exact normalized title, or exact after removing a
 * trailing parenthetical from the song name — and if the placeholder
 * has an artist, the song's author must loosely agree.
 */
export function matchPlaceholder(placeholder, songs) {
  const wanted = normalizeTitle(placeholder.name);
  if (!wanted) return null;

  const candidates = songs.filter((song) => {
    const name = normalizeTitle(song.name);
    const nameNoParen = normalizeTitle((song.name || "").replace(/\s*\([^)]*\)\s*$/, ""));
    return name === wanted || nameNoParen === wanted;
  });
  if (candidates.length === 0) return null;

  if (placeholder.artist) {
    const artist = normalizeTitle(placeholder.artist);
    const byArtist = candidates.filter((song) =>
      normalizeTitle(song.author).includes(artist),
    );
    if (byArtist.length > 0) return byArtist[0];
  }
  return candidates[0];
}
