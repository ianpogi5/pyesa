#!/usr/bin/env node
/**
 * Generates public/files/sets.json from the files in public/files/mass/
 * Run: node scripts/generate-manifest.js
 */
import { readdirSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { buildSetsManifest } from "../server/lib/sets.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const massDir = join(__dirname, "..", "public", "files", "mass");
const filesDir = join(__dirname, "..", "public", "files");
const outputPath = join(filesDir, "sets.json");

if (!existsSync(massDir)) {
  console.warn(`Warning: ${massDir} not found — writing empty sets.json`);
  if (!existsSync(filesDir)) mkdirSync(filesDir, { recursive: true });
  writeFileSync(outputPath, "[]");
  process.exit(0);
}

const sets = buildSetsManifest(readdirSync(massDir));
writeFileSync(outputPath, JSON.stringify(sets, null, 2));
console.log(`Generated sets.json with ${sets.length} entries`);
