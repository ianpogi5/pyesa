import { createHash } from "node:crypto";
import { readZip } from "./zip.mjs";

/**
 * Parse a SongbookPro .sbp export.
 *
 * Format (reverse-engineered and validated against real exports):
 *   - zip containing dataFile.txt and dataFile.hash
 *   - dataFile.hash = MD5 hex of dataFile.txt's bytes
 *   - dataFile.txt = "1.0\r\n" + minified JSON { songs, sets, folders }
 */
export function parseSbp(buffer) {
  const entries = readZip(buffer);
  const dataFile = entries.get("dataFile.txt");
  if (!dataFile) {
    throw new Error("Not a SongbookPro export: missing dataFile.txt");
  }

  const hashFile = entries.get("dataFile.hash");
  if (hashFile) {
    const expected = hashFile.toString("utf-8").trim();
    const actual = createHash("md5").update(dataFile).digest("hex");
    if (expected !== actual) {
      throw new Error("Corrupt .sbp: dataFile.hash mismatch");
    }
  }

  const text = dataFile.toString("utf-8");
  const newline = text.indexOf("\n");
  const version = text.slice(0, newline).trim();
  if (version !== "1.0") {
    throw new Error(`Unsupported .sbp data version "${version}"`);
  }

  const data = JSON.parse(text.slice(newline + 1));
  return {
    songs: data.songs || [],
    sets: data.sets || [],
    folders: data.folders || [],
  };
}
