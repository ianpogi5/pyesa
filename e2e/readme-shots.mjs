#!/usr/bin/env node
/**
 * Regenerates docs/screenshots/*.png for the README against the local
 * dev server + e2e/local-api.mjs stub. Run after meaningful UI changes.
 *
 * Usage: node e2e/readme-shots.mjs
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const OUT = new URL("../docs/screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:5173";
const KEY = "1234";

// Seed a nice-looking draft through the stub API
const lib = await (await fetch(`${BASE}/files/library.json`)).json();
const bySlug = new Map(lib.map((s) => [s.slug, s]));
const item = (slug) => {
  const s = bySlug.get(slug);
  return { type: "song", slug, name: s.name, author: s.author || "", subTitle: s.subTitle || "" };
};
const draftRes = await fetch(`${BASE}/api/drafts`, {
  method: "POST",
  headers: { "x-pyesa-key": KEY, "content-type": "application/json" },
  body: JSON.stringify({
    name: "16th Sunday in Ordinary Time",
    date: "2026-07-19",
    items: [
      item("sa-hapag-ng-panginoon"),
      item("papuri-sa-diyos"),
      { type: "placeholder", name: "Tinapay ng Buhay", album: "", artist: "Palana" },
      item("ama-namin"),
    ],
  }),
});
const draft = await draftRes.json();
console.log("seeded draft", draft.id);

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_BIN || "/usr/lib64/chromium-browser/chromium-browser",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--force-prefers-reduced-motion"],
});

async function mobilePage(dark = true) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 780 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: dark ? "dark" : "light",
  });
  const page = await ctx.newPage();
  await page.addInitScript((key) => localStorage.setItem("pyesa-key", key), KEY);
  return page;
}

const p = await mobilePage();

// 1. Sets → auto-selects current week's songs
await p.goto(`${BASE}/sets`);
await p.locator("text=/^1$/").last().waitFor({ timeout: 15000 });
await p.waitForTimeout(600);
await p.screenshot({ path: `${OUT}sets.png` });

// 2. Song viewer (lyrics)
await p.locator("button", { hasText: "1" }).last().click();
await p.waitForSelector("text=/Prev/");
await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}viewer.png` });

// 3. Chords mode
await p.click('button:has-text("Chords")');
await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}chords.png` });

// 4. Library with search
await p.goto(`${BASE}/library`);
await p.locator("text=/\\d+ songs/").last().waitFor();
await p.locator('input[type="text"]').last().fill("panginoon");
await p.waitForTimeout(700);
await p.screenshot({ path: `${OUT}library.png` });

// 5. Rosario
await p.goto(`${BASE}/rosario`);
await p.waitForSelector("text=AWIT", { timeout: 15000 }).catch(() => {});
await p.waitForTimeout(600);
await p.screenshot({ path: `${OUT}rosario.png` });

// 6. Builder editor with the seeded draft
await p.goto(`${BASE}/builder/${draft.id}`);
await p.waitForSelector('button:has-text("Add Song")');
await p.locator("text=Needs encoding").last().waitFor();
await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}builder.png` });

await p.context().close();

// 7. Desktop split view
const desk = await browser.newContext({
  viewport: { width: 1440, height: 860 },
  deviceScaleFactor: 2,
  colorScheme: "dark",
});
const d = await desk.newPage();
await d.goto(`${BASE}/sets`);
await d.locator("text=/^1$/").first().waitFor({ timeout: 15000 });
await d.locator("button", { hasText: "1" }).first().click();
await d.waitForTimeout(700);
await d.screenshot({ path: `${OUT}desktop.png` });
await desk.close();

console.log("screenshots written to", OUT);
await browser.close();
