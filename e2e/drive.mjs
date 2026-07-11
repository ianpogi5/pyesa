#!/usr/bin/env node
/**
 * End-to-end drive of the set builder in a headless browser.
 *
 * Prereqs: e2e/local-api.mjs running on :8787, and the app served with
 * PYESA_API_ORIGIN=http://localhost:8787 (npm run dev, or vite preview
 * for the production build).
 *
 * Usage:
 *   BASE_URL=http://localhost:5173 node e2e/drive.mjs
 *   CHROMIUM_BIN=/path/to/chromium node e2e/drive.mjs
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const SHOTS = new URL("./shots/", import.meta.url).pathname; // gitignored
mkdirSync(SHOTS, { recursive: true });

const BASE = process.env.BASE_URL || "http://localhost:5173";
const errors = [];
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_BIN || "/usr/lib64/chromium-browser/chromium-browser",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
page.on("pageerror", (err) => errors.push(String(err)));
page.on("dialog", (d) => d.accept());

const shot = (name) => page.screenshot({ path: `${SHOTS}${name}.png` });
const step = (label) => console.log("step:", label);

try {
  step("unlock form");
  await page.goto(`${BASE}/builder`);
  await page.waitForSelector("text=Enter the choir passcode");
  await shot("01-unlock");

  step("wrong passcode rejected");
  await page.fill('input[type="password"]', "9999");
  await page.click('button:has-text("Unlock")');
  await page.waitForSelector("text=Wrong passcode");

  step("unlock with 1234");
  await page.fill('input[type="password"]', "1234");
  await page.click('button:has-text("Unlock")');
  await page.waitForSelector('text=New Set');
  await shot("02-drafts-empty");

  step("create draft (with liturgical name suggestion)");
  await page.click('button:has-text("New Set")');
  await page.waitForFunction(
    () => document.querySelector('input[placeholder*="16th Sunday"]')?.value.includes("Sunday"),
    { timeout: 15000 },
  );
  const suggested = await page.inputValue('input[placeholder*="16th Sunday"]');
  console.log("  suggested name:", suggested);
  await page.fill('input[placeholder*="16th Sunday"]', "Test Sunday Set");
  await page.click('button:has-text("Create Set")');
  await page.waitForSelector('button:has-text("Add Song")');
  await shot("03-editor-empty");

  step("add placeholder (missing song)");
  await page.click('button:has-text("Missing Song")');
  await page.fill('input[placeholder*="Tinapay"]', "Anima Christi");
  const optional = page.locator('input[placeholder="Optional"]');
  await optional.nth(1).fill("Marty Haugen");
  await page.click('button:has-text("Add Placeholder")');
  await page.waitForSelector("text=Needs encoding");

  step("add library song via search (with preview)");
  await page.click('button:has-text("Add Song")');
  await page.fill('input[placeholder*="Search by name"]', "papuri sa diyos");
  await page.waitForSelector("text=result");
  await page.click('button:has-text("Papuri Sa Diyos")');
  await page.waitForSelector("text=Back to results");
  await shot("04a-search-preview");
  await page.click('button:has-text("Add to Set")');
  await page.waitForSelector('span:has-text("2")');

  step("quick salmo");
  await page.click(`button:has-text("This Week's Salmo")`);
  await page.fill('input[placeholder*="tanglaw"]', "Panginoo'y aking tanglaw,");
  await page.fill('input[placeholder*="kaligtasan"]', "siya'ng aking kaligtasan.");
  await page.waitForSelector("text=Preview");
  await shot("04b-salmo-modal");
  await page.click('button:has-text("Add to Set")');
  await page.waitForSelector("text=/Salmo - \\d{4}/");

  step("preview item already in draft");
  await page.click('p:has-text("Papuri Sa Diyos")');
  await page.waitForSelector('button[aria-label="Close preview"]');
  await shot("04c-item-preview");
  await page.click('button[aria-label="Close preview"]');

  step("wait for autosave");
  await page.waitForSelector("text=Saved", { timeout: 8000 });
  await shot("04-editor-items");

  step("publish blocked by placeholder");
  const publish = await page.locator('button:has-text("Publish Set")').count();
  if (publish !== 0) throw new Error("Publish button should be hidden with placeholders");
  await page.waitForSelector("text=still needs encoding");

  step("back to list, upload .sbp");
  await page.click('header button[aria-label="Go back"]');
  await page.waitForSelector('button:has-text("Upload .sbp")');
  await page.setInputFiles('input[type="file"]', new URL("./fixtures/test-song.sbp", import.meta.url).pathname);
  await page.waitForSelector("text=/songs? added/");
  await page.waitForSelector('text=resolved in Test Sunday Set');
  await shot("05-upload-result");

  step("reopen draft — placeholder resolved");
  await page.locator("button", { hasText: "3 songs" }).click();
  await page.waitForSelector('button:has-text("Publish Set")', { timeout: 8000 });
  const stillPlaceholder = await page.locator("text=Needs encoding").count();
  if (stillPlaceholder !== 0) throw new Error("Placeholder was not resolved");
  await shot("06-resolved");

  step("publish (uploads share card image)");
  await page.click('button:has-text("Publish Set")');
  await page.waitForSelector("text=Published");
  await page.waitForSelector('button:has-text("Copy share link")');
  await shot("07-published");

  step("reopen published set and republish");
  await page.click('button:has-text("Edit Set")');
  await page.waitForSelector('button:has-text("Publish Set")');
  await page.click('button:has-text("Publish Set")');
  await page.waitForSelector("text=Published");

  step("footer present");
  await page.waitForSelector("text=/Pyesa v\\d/");
  await page.waitForSelector('a:has-text("PG Choir")');
  await page.waitForSelector('a:has-text("GitHub")');

  step("desktop layout sanity");
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${BASE}/builder`);
  await page.waitForSelector("text=Finalized");
  await shot("08-desktop");

  console.log("PASS");
} catch (err) {
  await shot("99-failure");
  console.error("FAIL:", err.message);
  process.exitCode = 1;
} finally {
  if (errors.length) {
    console.log("console errors:");
    for (const e of errors) console.log("  -", e);
  } else {
    console.log("no console errors");
  }
  await browser.close();
}
