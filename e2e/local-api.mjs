#!/usr/bin/env node
/**
 * Local stand-in for the deployed API Lambda: runs the real router
 * against an in-memory store on :8787, seeded with the local library.
 *
 * Usage:
 *   node e2e/local-api.mjs &
 *   PYESA_API_ORIGIN=http://localhost:8787 npm run dev   # (or preview)
 *
 * Passcode is "1234".
 */
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHandler } from "../server/lib/router.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const objects = new Map();
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
  async putBinary(key, buffer) {
    objects.set(key, buffer);
  },
  async list(prefix) {
    return [...objects.keys()].filter((k) => k.startsWith(prefix)).sort();
  },
  async remove(key) {
    objects.delete(key);
  },
};

// Seed the library from the real local song data
try {
  objects.set(
    "files/library.json",
    readFileSync(join(__dirname, "..", "public", "files", "library.json"), "utf-8"),
  );
} catch {
  console.warn("library.json not found — run `npm run generate-data` first");
}

const handler = createHandler({
  store,
  invalidate: async (paths) => console.log("invalidate:", paths.join(", ")),
  env: { PASSCODE: "1234", DOMAIN: "pyesa.kdc.sh" },
});

createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);
  const isBinary = req.headers["content-type"] === "application/octet-stream";
  const result = await handler({
    rawPath: req.url.split("?")[0],
    requestContext: { http: { method: req.method } },
    headers: req.headers,
    body: body.length ? body.toString(isBinary ? "base64" : "utf-8") : undefined,
    isBase64Encoded: isBinary && body.length > 0,
  });
  res.writeHead(result.statusCode, result.headers);
  res.end(result.body);
  console.log(req.method, req.url, "→", result.statusCode);
}).listen(8787, () => console.log("local api on :8787 (passcode 1234)"));
