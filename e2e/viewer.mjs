#!/usr/bin/env node
/**
 * End-to-end drive of the song viewer's performance features: fullscreen,
 * auto-fit, remembered preferences, foot-pedal keys, swipe guarding,
 * duration-paced auto-scroll, and the background-refresh regression.
 *
 * Prereqs: the app served on BASE_URL (npm run dev is enough; no API needed).
 *
 * Usage:
 *   BASE_URL=http://localhost:5173 node e2e/viewer.mjs
 *   CHROMIUM_BIN=/path/to/chromium node e2e/viewer.mjs
 *
 * Gotcha: pages render the viewer twice (desktop + mobile copy, one hidden),
 * so selectors here always use :visible or scope to the fullscreen overlay.
 */
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const OVERLAY = ".fixed.inset-0.z-\\[200\\]";
const errors = [];
let failures = 0;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_BIN || "/usr/lib64/chromium-browser/chromium-browser",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--force-prefers-reduced-motion"],
});

const step = (label) => console.log("step:", label);
const check = (cond, label) => {
  if (cond) console.log("  ok:", label);
  else {
    failures++;
    console.log("  FAIL:", label);
  }
};

function watch(page) {
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
}

// The viewer copy the user can see: the fullscreen overlay if up, else the
// visible one of the two page copies.
const viewerState = (page) =>
  page.evaluate((OVERLAY) => {
    const overlay = document.querySelector(OVERLAY);
    const root =
      overlay ||
      [...document.querySelectorAll(".song-content")]
        .map((e) => e.closest(".flex.flex-col"))
        .find((e) => e && e.getClientRects().length > 0);
    if (!root) return null;
    const box = root.querySelector(".song-content").parentElement;
    const content = root.querySelector(".song-content");
    const counter = (root.textContent.match(/(\d+) \/ (\d+)/) || [])[0];
    return {
      title: root.querySelector("h2")?.textContent,
      counter,
      index: counter ? Number(counter.split(" / ")[0]) : null,
      fullscreen: !!overlay,
      font: parseFloat(getComputedStyle(content).fontSize),
      chords: content.tagName === "PRE",
      scrollTop: box.scrollTop,
      // Same definition the scroller uses: to the end of the lyrics, not the box
      travel: Math.max(
        0,
        Math.round(
          content.getBoundingClientRect().bottom -
            box.getBoundingClientRect().top +
            box.scrollTop,
        ) - box.clientHeight,
      ),
      fitButton: !!root.querySelector("button:not([hidden])") &&
        [...root.querySelectorAll("button")].some((b) => b.textContent.trim() === "Fit"),
      stored: localStorage.getItem("pyesa-viewer-prefs"),
    };
  }, OVERLAY);

async function openFirstSet(page) {
  await page.goto(`${BASE}/sets`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.locator("button:visible").nth(4).click();
  await page.waitForTimeout(1200);
}

// ---------------------------------------------------------------- tablet
{
  const ctx = await browser.newContext({
    viewport: { width: 1024, height: 768 },
    colorScheme: "dark",
    hasTouch: true,
  });
  const page = await ctx.newPage();
  watch(page);

  step("preferences survive a reload");
  await openFirstSet(page);
  await page.locator("button:visible", { hasText: "Chords" }).first().click();
  await page.locator('[aria-label="Larger text"]:visible').first().click();
  await page.locator('[aria-label="Larger text"]:visible').first().click();
  await page.waitForTimeout(300);
  let s = await viewerState(page);
  check(s.chords && s.font === 20, `chords on, 20px (got chords=${s.chords} font=${s.font})`);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  s = await viewerState(page);
  check(s.chords && s.font === 20, "still chords at 20px after reload");
  await page.locator("button:visible", { hasText: "Lyrics" }).first().click();
  await page.waitForTimeout(300);

  step("fullscreen auto-fits, +/- do not leak into the normal size");
  await page.keyboard.press("f");
  await page.waitForTimeout(1500);
  s = await viewerState(page);
  check(s.fullscreen, "F enters fullscreen");
  check(s.font > 20, `auto-fit enlarged the text (${s.font}px)`);
  check(!s.fitButton, "no Fit button while auto-fitting");
  const fitted = s.font;
  await page.keyboard.press("+");
  await page.waitForTimeout(300);
  s = await viewerState(page);
  check(s.font === fitted + 2, `+ nudges from the fitted size (${s.font}px)`);
  check(s.fitButton, "Fit button appears after a manual nudge");
  await page.locator(`${OVERLAY} button`, { hasText: "Fit" }).click();
  await page.waitForTimeout(600);
  s = await viewerState(page);
  check(s.font === fitted && !s.fitButton, "Fit returns to the automatic size");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  s = await viewerState(page);
  check(!s.fullscreen, "Esc exits fullscreen");
  check(s.font === 20, `normal size untouched by fullscreen (${s.font}px)`);
  check(JSON.parse(s.stored).fontSize === 20, "stored preference untouched");

  step("pedal in page mode: page down, then next song at the end (no double-fire)");
  await page.keyboard.press("f");
  await page.waitForTimeout(1500);
  s = await viewerState(page);
  const startIndex = s.index;
  let presses = 0;
  while ((await viewerState(page)).index === startIndex && presses < 12) {
    await page.keyboard.press("PageDown");
    presses++;
    await page.waitForTimeout(450);
  }
  s = await viewerState(page);
  check(s.index === startIndex + 1, `advanced exactly one song after ${presses} pedal presses (now ${s.counter})`);
  check(s.scrollTop === 0, "new song starts at the top");
  await page.keyboard.press("PageUp");
  await page.waitForTimeout(450);
  s = await viewerState(page);
  check(s.index === startIndex, "PageUp at the top goes back one song");

  step("held pedal (auto-repeat) does not race through songs");
  const before = (await viewerState(page)).index;
  await page.evaluate(() => {
    for (let i = 0; i < 5; i++)
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", repeat: true, bubbles: true }));
  });
  await page.waitForTimeout(400);
  check((await viewerState(page)).index === before, "repeat events ignored");

  step("pedal in song mode + learn a custom key");
  await page.locator(`${OVERLAY} [aria-label="Foot pedal and keyboard settings"]`).click();
  await page.waitForTimeout(300);
  check(await page.locator('[data-testid="viewer-settings"]').isVisible(), "settings panel opens");
  await page.locator('[data-testid="viewer-settings"] button', { hasText: "Next / previous song" }).click();
  await page.waitForTimeout(200);
  let idx = (await viewerState(page)).index;
  await page.keyboard.press("Space");
  await page.waitForTimeout(400);
  s = await viewerState(page);
  check(s.index === idx + 1, `Space jumps straight to the next song (${s.counter})`);
  check(s.fullscreen, "Space did not re-trigger the focused fullscreen button");
  // learn F7 as the forward key
  await page.locator('[data-testid="viewer-settings"] button', { hasText: "Learn" }).first().click();
  await page.waitForTimeout(200);
  await page.keyboard.press("F7");
  await page.waitForTimeout(300);
  const kbds = await page.locator('[data-testid="viewer-settings"] kbd').allTextContents();
  check(kbds.includes("F7"), `forward key learned as F7 (${kbds.join(",")})`);
  idx = (await viewerState(page)).index;
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(400);
  check((await viewerState(page)).index === idx, "old default key no longer advances");
  await page.keyboard.press("F7");
  await page.waitForTimeout(400);
  check((await viewerState(page)).index === idx + 1, "learned key advances");
  s = await viewerState(page);
  const stored = JSON.parse(s.stored);
  check(stored.pedal?.mode === "song" && stored.pedal?.forward?.[0] === "F7", "pedal settings persisted");
  await page.locator('[data-testid="viewer-settings"] [aria-label="Reset forward keys"]').click();
  await page.locator('[data-testid="viewer-settings"] button', { hasText: "Page, then next song" }).click();
  await page.locator('[aria-label="Close settings"]').click();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);

  step("auto-scroll paces to the recorded song length");
  await page.keyboard.press("f");
  await page.waitForTimeout(1500);
  const lib = await (await fetch(`${BASE}/files/library.json`)).json();
  // Auto-fit may land the whole song on one screen; grow it until there is
  // enough travel for the rate to be measurable
  for (let i = 0; i < 20 && (await viewerState(page)).travel < 400; i++) {
    await page.keyboard.press("+");
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(300);
  s = await viewerState(page);
  const d2 = lib.find((x) => x.name === s.title)?.Duration2;
  if (s.travel >= 400 && d2) {
    await page.keyboard.press("s");
    await page.waitForTimeout(5000);
    const after = await viewerState(page);
    await page.keyboard.press("s");
    const rate = (after.scrollTop - s.scrollTop) / 5;
    const projected = s.travel / rate;
    check(Math.abs(projected - d2) / d2 < 0.25, `"${s.title}" projects to ${projected.toFixed(0)}s vs Duration2 ${d2}s`);
  } else {
    console.log(`  skip: "${s.title}" has travel=${s.travel} Duration2=${d2}`);
  }
  await page.keyboard.press("Escape");

  step("keys typed into a search box are not treated as shortcuts");
  await page.goto(`${BASE}/library`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.locator("button:visible").nth(5).click();
  await page.waitForTimeout(600);
  await page.locator("input:visible").first().focus();
  await page.keyboard.type("f");
  await page.waitForTimeout(400);
  s = await viewerState(page);
  check(s && !s.fullscreen, "typing f in the search box did not open fullscreen");

  await ctx.close();
}

// ----------------------------------------------------------------- phone
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 780 },
    isMobile: true,
    hasTouch: true,
    colorScheme: "dark",
  });
  const page = await ctx.newPage();
  watch(page);

  step("swipe: vertical-ish drags scroll, only clear horizontal swipes change song");
  await page.goto(`${BASE}/sets`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.locator("body").click({ position: { x: 195, y: 200 } });
  await page.waitForTimeout(800);
  await page.locator("body").click({ position: { x: 195, y: 180 } });
  await page.waitForTimeout(800);
  const swipe = (dx, dy) =>
    page.evaluate(
      ({ dx, dy }) => {
        const root = [...document.querySelectorAll(".song-content")]
          .map((e) => e.closest(".flex.flex-col"))
          .find((e) => e && e.getClientRects().length > 0);
        const mk = (type, x, y) => {
          const t = new Touch({ identifier: 1, target: root, clientX: x, clientY: y });
          return new TouchEvent(type, { touches: type === "touchend" ? [] : [t], changedTouches: [t], bubbles: true });
        };
        root.dispatchEvent(mk("touchstart", 200, 400));
        root.dispatchEvent(mk("touchend", 200 - dx, 400 - dy));
      },
      { dx, dy },
    );
  let s = await viewerState(page);
  const at = s.index;
  await swipe(120, 300); // diagonal: mostly a scroll
  await page.waitForTimeout(300);
  check((await viewerState(page)).index === at, "diagonal drag (120px right, 300px up) did not change song");
  await swipe(150, 10);
  await page.waitForTimeout(300);
  check((await viewerState(page)).index === at + 1, "clean horizontal swipe advances");
  await swipe(-150, 10);
  await page.waitForTimeout(300);
  check((await viewerState(page)).index === at, "reverse swipe goes back");

  await ctx.close();
}

// -------------------------------------------- background refresh regression
{
  // Block the service worker so a page route can slow the mass-file fetch
  const ctx = await browser.newContext({
    viewport: { width: 1024, height: 768 },
    colorScheme: "dark",
    serviceWorkers: "block",
  });
  const page = await ctx.newPage();
  watch(page);
  step("a slow background refresh must not move the performer off their song");
  await openFirstSet(page);
  const setUrl = page.url();
  await page.route(/\/files\/mass\/.*\.json/, async (route) => {
    await new Promise((r) => setTimeout(r, 4000));
    await route.continue();
  });
  await page.goto(setUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.locator("button:visible", { hasText: "Next" }).first().click();
  await page.locator("button:visible", { hasText: "Next" }).first().click();
  await page.waitForTimeout(300);
  const before = await viewerState(page);
  await page.waitForTimeout(5000);
  const after = await viewerState(page);
  check(before.index === 3 && after.index === 3, `stayed on ${before.counter} (after refresh: ${after.counter})`);
  await ctx.close();
}

await browser.close();

const benign = /401 \(Unauthorized\)|compute-pressure/;
const realErrors = errors.filter((e) => !benign.test(e));
if (realErrors.length) {
  console.log("console errors:");
  for (const e of realErrors) console.log("  -", e);
}
console.log(failures === 0 && realErrors.length === 0 ? "PASS" : `FAIL (${failures} checks, ${realErrors.length} errors)`);
process.exit(failures === 0 && realErrors.length === 0 ? 0 : 1);
