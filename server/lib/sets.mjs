/**
 * Build the sets.json manifest from a list of set filenames
 * ("YYYY-MM-DD - Name.json"). Newest first.
 */
export function buildSetsManifest(filenames) {
  return filenames
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse()
    .map((filename) => {
      const match = filename
        .replace(".json", "")
        .match(/^(\d{4}-\d{2}-\d{2})\s*-\s*(.+)$/);
      if (match) {
        return { filename, date: match[1], name: match[2].trim() };
      }
      return { filename, date: "", name: filename.replace(".json", "") };
    });
}
