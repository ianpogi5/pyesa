/**
 * Quick-Salmo helpers: every Sunday the responsorial psalm (Salmo) has new
 * lyrics (two lines) but is sung to the same chords. We extract the chord
 * pattern from the existing "Salmo" song in the library and re-apply it to
 * the new lyrics, distributing chords across the words.
 */

/**
 * Extract the reusable template from a Salmo song's ChordPro content:
 * its intro line and the chord sequence of each lyric line.
 */
export function extractSalmoTemplate(content) {
  const lines = (content || "").split("\n");
  const intro = lines.find((l) => /^\s*intro\s*:/i.test(l))?.trim() || "";
  const chordLines = [];
  for (const line of lines) {
    if (/^\s*intro\s*:/i.test(line)) continue;
    if (/^\s*\{/.test(line)) continue; // ChordPro directives
    const chords = [...line.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
    const hasLyrics = line.replace(/\[[^\]]+\]/g, "").trim().length > 0;
    if (chords.length > 0 && hasLyrics) chordLines.push(chords);
  }
  return { intro, chordLines };
}

/** Place chords at evenly spaced word boundaries across a lyric line. */
function applyChords(line, chords) {
  const text = line.trim();
  if (!text || chords.length === 0) return text;
  const words = text.split(/\s+/);
  const positions = chords.map((_, i) =>
    Math.min(Math.floor((i * words.length) / chords.length), words.length - 1),
  );
  const byWord = new Map();
  positions.forEach((pos, i) => {
    byWord.set(pos, (byWord.get(pos) || "") + `[${chords[i]}]`);
  });
  return words.map((w, i) => (byWord.get(i) || "") + w).join(" ");
}

/**
 * Build the ChordPro content for a new Salmo from the template and the
 * week's lyric lines.
 */
export function buildSalmoContent(template, lyricLines) {
  const out = [];
  if (template.intro) out.push(template.intro, "");
  lyricLines
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line, i) => {
      const chords =
        template.chordLines[i] ||
        template.chordLines[template.chordLines.length - 1] ||
        [];
      out.push(applyChords(line, chords));
    });
  return out.join("\n") + "\n";
}
