#!/usr/bin/env node
/**
 * Cleans raw song export files in public/files/mass/:
 *   1. Removes the "1.0" first line to make valid JSON
 *   2. Removes top-level "sets" and "folders" keys
 *   3. Pretty-prints with 2-space indentation
 *
 * Only modifies files that need cleaning (start with "1.0\n").
 * Run: node scripts/clean-song-files.js
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const massDir = join(__dirname, "..", "public", "files", "mass");

if (!existsSync(massDir)) {
  console.log("No mass directory found — nothing to clean.");
  process.exit(0);
}

const files = readdirSync(massDir).filter((f) => f.endsWith(".json"));
let cleaned = 0;

for (const file of files) {
  const filePath = join(massDir, file);
  const raw = readFileSync(filePath, "utf-8");

  // Only process files that start with "1.0" on the first line (raw exports)
  if (!raw.startsWith("1.0\n") && !raw.startsWith("1.0\r\n")) continue;

  const jsonStr = raw.slice(raw.indexOf("\n") + 1);
  const data = JSON.parse(jsonStr);

  // Keep only the songs array
  const output = { songs: data.songs };

  writeFileSync(filePath, JSON.stringify(output, null, 2) + "\n");
  console.log(`  Cleaned: ${file}`);
  cleaned++;
}

console.log(
  cleaned > 0 ? `Cleaned ${cleaned} file(s).` : "No files needed cleaning.",
);
