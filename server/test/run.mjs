#!/usr/bin/env node
/**
 * Smoke test for the API Lambda: runs the whole draft → upload-sbp →
 * finalize lifecycle against an in-memory store, using a real
 * SongbookPro export (sample.sbp in the repo root) when present.
 *
 * Run: node api/test/run.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert";
import { createHandler } from "../lib/router.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sbpPath = join(__dirname, "..", "..", "sample.sbp");

// ---------- In-memory store ----------
const objects = new Map();
const invalidations = [];
const store = {
  async getJson(key) {
    return objects.has(key) ? JSON.parse(objects.get(key)) : null;
  },
  async putJson(key, obj) {
    objects.set(key, JSON.stringify(obj));
  },
  async putText(key, text) {
    objects.set(key, text);
  },
  async list(prefix) {
    return [...objects.keys()].filter((k) => k.startsWith(prefix)).sort();
  },
  async remove(key) {
    objects.delete(key);
  },
};

const PASSCODE = "test-passcode";
const handler = createHandler({
  store,
  invalidate: async (paths) => invalidations.push(paths),
  env: { PASSCODE, DOMAIN: "pyesa.kdc.sh" },
});

function call(method, path, { body, key = PASSCODE, base64 } = {}) {
  return handler({
    rawPath: path,
    requestContext: { http: { method } },
    headers: key ? { "x-pyesa-key": key } : {},
    body: base64 ?? (body !== undefined ? JSON.stringify(body) : undefined),
    isBase64Encoded: Boolean(base64),
  });
}

async function expect(status, promise, label) {
  const res = await promise;
  assert.equal(
    res.statusCode,
    status,
    `${label}: expected ${status}, got ${res.statusCode}: ${res.body}`,
  );
  console.log(`  ok: ${label}`);
  return JSON.parse(res.body);
}

// ---------- Tests ----------
console.log("router basics");
await expect(200, call("GET", "/api/health", { key: null }), "health needs no auth");
await expect(401, call("GET", "/api/drafts", { key: null }), "drafts without key → 401");
await expect(401, call("GET", "/api/drafts", { key: "wrong" }), "drafts with wrong key → 401");
await expect(200, call("GET", "/api/auth/check"), "auth check with key");
await expect(404, call("GET", "/api/nope"), "unknown route → 404");

console.log("draft lifecycle");
await expect(400, call("POST", "/api/drafts", { body: { name: "", date: "2026-07-19" } }), "empty name rejected");
await expect(400, call("POST", "/api/drafts", { body: { name: "X", date: "July 19" } }), "bad date rejected");

const draft = await expect(
  201,
  call("POST", "/api/drafts", {
    body: {
      name: "16th Sunday in Ordinary Time",
      date: "2026-07-19",
      items: [
        { type: "placeholder", name: "Magpuri sa Panginoong", album: "", artist: "" },
        { type: "placeholder", name: "Some Song Nobody Encoded", album: "", artist: "" },
      ],
    },
  }),
  "create draft with placeholders",
);
assert.equal(draft.status, "active");

const list = await expect(200, call("GET", "/api/drafts"), "list drafts");
assert.equal(list.length, 1);

await expect(
  400,
  call("POST", `/api/drafts/${draft.id}/finalize`),
  "finalize blocked while placeholders remain",
);

if (!existsSync(sbpPath)) {
  console.log("\nsample.sbp not found — skipping upload/finalize tests");
  process.exit(0);
}

console.log("upload-sbp with real sample.sbp");
const sbp = readFileSync(sbpPath);
const upload = await expect(
  200,
  call("POST", "/api/upload-sbp", { base64: sbp.toString("base64") }),
  "upload parses and merges",
);
assert.equal(upload.songsAdded, 13, "13 songs added to empty library");
assert.equal(upload.placeholdersResolved.length, 1, "one placeholder resolved");
assert.equal(upload.placeholdersResolved[0].song, "Magpuri sa Panginoong");

const upload2 = await expect(
  200,
  call("POST", "/api/upload-sbp", { base64: sbp.toString("base64") }),
  "re-upload is idempotent",
);
assert.equal(upload2.songsAdded, 0, "no duplicates on re-upload");

const draft2 = await expect(200, call("GET", `/api/drafts/${draft.id}`), "get draft after upload");
assert.equal(draft2.items[0].type, "song", "placeholder became song");
assert.ok(draft2.items[0].slug, "resolved item has slug");
assert.equal(draft2.items[1].type, "placeholder", "unmatched placeholder survives");

console.log("finalize");
const removed = await expect(
  200,
  call("PUT", `/api/drafts/${draft.id}`, {
    body: { items: [draft2.items[0]] },
  }),
  "drop unresolved placeholder via PUT",
);
assert.equal(removed.items.length, 1);

const fin = await expect(200, call("POST", `/api/drafts/${draft.id}/finalize`), "finalize succeeds");
assert.equal(fin.filename, "2026-07-19 - 16th Sunday in Ordinary Time.json");
assert.ok(fin.shareUrl.includes("/share/"), "share url returned");

const massFile = JSON.parse(objects.get(`files/mass/${fin.filename}`));
assert.equal(massFile.songs.length, 1);
assert.equal(massFile.songs[0].name, "Magpuri sa Panginoong");
assert.ok(massFile.songs[0].content.includes("{c: Koro}"), "full ChordPro content present");

const manifest = JSON.parse(objects.get("files/sets.json"));
assert.equal(manifest[0].date, "2026-07-19");
assert.equal(manifest[0].name, "16th Sunday in Ordinary Time");

const sharePath = fin.shareUrl.replace("https://pyesa.kdc.sh/", "");
const share = objects.get(sharePath);
assert.ok(share, `share page written at ${sharePath}`);
assert.ok(share.includes('og:title" content="16th Sunday in Ordinary Time — 2026-07-19"'), "og:title");
assert.ok(share.includes("1. Magpuri sa Panginoong"), "og:description lists songs");
assert.ok(invalidations.flat().includes("/share/*"), "cloudfront invalidated");

const finDraft = await expect(200, call("GET", `/api/drafts/${draft.id}`), "finalized draft kept");
assert.equal(finDraft.status, "finalized");

await expect(200, call("DELETE", `/api/drafts/${draft.id}`), "delete draft");
assert.equal((await store.list("files/drafts/")).length, 0);

console.log("\nAll API smoke tests passed.");
