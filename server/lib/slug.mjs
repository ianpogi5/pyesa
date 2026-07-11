/**
 * Generate a stable slug from a song name for deduplication.
 * The same song appearing in different sets will produce the same slug.
 * Shared by the frontend (src/db), the build scripts, and the API Lambda —
 * all three must agree on slugs.
 */
export function toSlug(name) {
  return (name || "untitled")
    .trim()
    .toLowerCase()
    .replace(/[\s/\\]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
