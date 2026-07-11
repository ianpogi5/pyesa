#!/usr/bin/env node
/**
 * Builds/updates public/files/library.json — the canonical deduped song
 * library — by merging all songs from public/files/mass/*.json into the
 * existing library (if any).
 *
 * Merging (not regenerating) matters: songs uploaded via the website's
 * .sbp upload may not appear in any mass set yet, and must survive.
 *
 * Run: node scripts/generate-library.js
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mergeSongsIntoLibrary } from "../server/lib/library.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filesDir = join(__dirname, "..", "public", "files");
const massDir = join(filesDir, "mass");
const libraryPath = join(filesDir, "library.json");

if (!existsSync(massDir)) {
  console.warn(`Warning: ${massDir} not found — skipping library generation`);
  process.exit(0);
}

const existing = existsSync(libraryPath)
  ? JSON.parse(readFileSync(libraryPath, "utf-8"))
  : [];

const incoming = [];
for (const file of readdirSync(massDir).filter((f) => f.endsWith(".json"))) {
  const data = JSON.parse(readFileSync(join(massDir, file), "utf-8"));
  incoming.push(...(data.songs || []));
}

const { songs, added, updated } = mergeSongsIntoLibrary(existing, incoming);
writeFileSync(libraryPath, JSON.stringify(songs, null, 2));
console.log(
  `library.json: ${songs.length} songs (${added} added, ${updated} updated)`,
);
