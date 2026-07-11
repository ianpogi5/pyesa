#!/usr/bin/env node
/**
 * Generates public/liturgy.json — a date → liturgical-day-name map used
 * by the set builder to suggest set names (e.g. 2026-07-12 → "15th
 * Sunday in Ordinary Time").
 *
 * romcal only runs here, at build time: its old CommonJS module graph
 * breaks when bundled for the browser (moment-recur patching executes
 * out of order), but works fine in Node. Regenerated on every build, so
 * the horizon extends with each release.
 *
 * Run: node scripts/generate-liturgy.js
 */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import Romcal from "romcal";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, "..", "public", "liturgy.json");

// Sundays and major days are what sets get named after
const KEEP_TYPES = new Set(["SUNDAY", "SOLEMNITY", "FEAST", "TRIDUUM"]);

const thisYear = new Date().getFullYear();
const days = {};
for (let year = thisYear; year <= thisYear + 2; year++) {
  for (const day of Romcal.calendarFor({ year })) {
    if (!KEEP_TYPES.has(day.type)) continue;
    const date = day.moment.slice(0, 10);
    // Match the choir's naming convention ("in", not "of", Ordinary Time)
    days[date] = day.name.replace(/(Sunday) of (Ordinary Time)/, "$1 in $2");
  }
}

writeFileSync(outputPath, JSON.stringify(days, null, 1));
console.log(
  `Generated liturgy.json with ${Object.keys(days).length} entries (${thisYear}–${thisYear + 2})`,
);
