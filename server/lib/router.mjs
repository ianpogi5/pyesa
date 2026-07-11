import { randomUUID, timingSafeEqual, createHash } from "node:crypto";
import { toSlug } from "./slug.mjs";
import { buildSetsManifest } from "./sets.mjs";
import { mergeSongsIntoLibrary } from "./library.mjs";
import { parseSbp } from "./sbp.mjs";
import { matchPlaceholder } from "./match.mjs";
import { renderSharePage } from "./share.mjs";

const LIBRARY_KEY = "files/library.json";
const DRAFTS_PREFIX = "files/drafts/";
const MASS_PREFIX = "files/mass/";

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

function safeEqual(a, b) {
  const bufA = Buffer.from(a || "");
  const bufB = Buffer.from(b || "");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** Reject names that would break filenames or S3 keys. */
function cleanName(name) {
  return (name || "").replace(/[/\\]/g, "-").trim();
}

function songItemFrom(song) {
  return {
    type: "song",
    slug: song.slug,
    name: song.name,
    author: song.author || "",
    subTitle: song.subTitle || "",
  };
}

/**
 * Create the API handler. Dependencies are injected so tests can run
 * against an in-memory store.
 *
 * store: getJson(key) | putJson(key, obj) | putText(key, text, contentType)
 *        | list(prefix) → key[] | remove(key)
 * invalidate: (paths[]) → Promise
 * env: { PASSCODE, DOMAIN }
 */
export function createHandler({ store, invalidate, env }) {
  async function listDrafts() {
    const keys = await store.list(DRAFTS_PREFIX);
    const drafts = [];
    for (const key of keys) {
      if (!key.endsWith(".json")) continue;
      const draft = await store.getJson(key);
      if (draft) drafts.push(draft);
    }
    drafts.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    return drafts;
  }

  async function regenerateSetsManifest() {
    const keys = await store.list(MASS_PREFIX);
    const filenames = keys
      .map((key) => key.slice(MASS_PREFIX.length))
      .filter(Boolean);
    const manifest = buildSetsManifest(filenames);
    await store.putJson("files/sets.json", manifest);
    return manifest;
  }

  function validateDraftInput(body) {
    const name = cleanName(body.name);
    const date = (body.date || "").trim();
    if (!name) return { error: "Set name is required" };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      return { error: "Date must be YYYY-MM-DD" };
    const items = Array.isArray(body.items) ? body.items : [];
    for (const item of items) {
      if (item.type === "song" && !item.slug)
        return { error: "Song items need a slug" };
      if (item.type === "placeholder" && !cleanName(item.name))
        return { error: "Placeholders need a song name" };
      if (item.type !== "song" && item.type !== "placeholder")
        return { error: `Unknown item type "${item.type}"` };
    }
    return { name, date, items };
  }

  async function handleFinalize(draftId) {
    const draftKey = `${DRAFTS_PREFIX}${draftId}.json`;
    const draft = await store.getJson(draftKey);
    if (!draft) return json(404, { error: "Draft not found" });

    const placeholders = draft.items.filter((i) => i.type === "placeholder");
    if (placeholders.length > 0) {
      return json(400, {
        error: "Set still has placeholder songs that need encoding",
        placeholders: placeholders.map((p) => p.name),
      });
    }
    if (draft.items.length === 0) {
      return json(400, { error: "Set has no songs" });
    }

    const library = (await store.getJson(LIBRARY_KEY)) || [];
    const bySlug = new Map(library.map((song) => [song.slug, song]));
    const songs = [];
    for (const item of draft.items) {
      const song = bySlug.get(item.slug);
      if (!song) {
        return json(400, {
          error: `Song "${item.name}" is missing from the library`,
        });
      }
      songs.push(song);
    }

    const filename = `${draft.date} - ${draft.name}.json`;
    await store.putJson(`${MASS_PREFIX}${filename}`, { songs });
    await regenerateSetsManifest();

    const shareSlug = toSlug(`${draft.date}-${draft.name}`);
    await store.putText(
      `share/${shareSlug}.html`,
      renderSharePage({
        domain: env.DOMAIN,
        filename,
        name: draft.name,
        date: draft.date,
        songs,
        slug: shareSlug,
        // The client uploads the card right after finalize succeeds.
        // ?v= busts Facebook's per-URL image cache on republish.
        imageUrl: `https://${env.DOMAIN}/share/${shareSlug}.png?v=${Date.now()}`,
      }),
      "text/html; charset=utf-8",
    );

    draft.status = "finalized";
    draft.finalizedAt = new Date().toISOString();
    draft.updatedAt = draft.finalizedAt;
    draft.filename = filename;
    draft.shareUrl = `https://${env.DOMAIN}/share/${shareSlug}.html`;
    await store.putJson(draftKey, draft);

    await invalidate(["/files/*", "/share/*"]);
    return json(200, { filename, shareUrl: draft.shareUrl });
  }

  async function handleUploadSbp(event) {
    if (!event.body) return json(400, { error: "Missing request body" });
    const buffer = Buffer.from(
      event.body,
      event.isBase64Encoded ? "base64" : "utf-8",
    );

    let parsed;
    try {
      parsed = parseSbp(buffer);
    } catch (err) {
      return json(400, { error: err.message });
    }

    const existing = (await store.getJson(LIBRARY_KEY)) || [];
    const { songs, added, updated } = mergeSongsIntoLibrary(
      existing,
      parsed.songs,
    );
    await store.putJson(LIBRARY_KEY, songs);

    // Resolve placeholders in active drafts against the merged library
    const resolved = [];
    for (const draft of await listDrafts()) {
      if (draft.status !== "active") continue;
      let changed = false;
      draft.items = draft.items.map((item) => {
        if (item.type !== "placeholder") return item;
        const song = matchPlaceholder(item, songs);
        if (!song) return item;
        changed = true;
        resolved.push({ draft: draft.name, placeholder: item.name, song: song.name });
        return songItemFrom(song);
      });
      if (changed) {
        draft.updatedAt = new Date().toISOString();
        await store.putJson(`${DRAFTS_PREFIX}${draft.id}.json`, draft);
      }
    }

    await invalidate(["/files/library.json", "/files/drafts/*"]);
    return json(200, {
      songsAdded: added,
      songsUpdated: updated,
      totalSongs: songs.length,
      placeholdersResolved: resolved,
    });
  }

  return async function handler(event) {
    const method = event.requestContext?.http?.method || "GET";
    const path = event.rawPath || "/";

    try {
      if (method === "GET" && path === "/api/health") {
        return json(200, { ok: true });
      }

      // Everything else requires the passcode
      const key =
        event.headers?.["x-pyesa-key"] || event.headers?.["X-Pyesa-Key"];
      if (!env.PASSCODE || !safeEqual(key, env.PASSCODE)) {
        return json(401, { error: "Wrong or missing passcode" });
      }

      if (method === "GET" && path === "/api/auth/check") {
        return json(200, { ok: true });
      }

      if (path === "/api/drafts") {
        if (method === "GET") return json(200, await listDrafts());
        if (method === "POST") {
          const body = JSON.parse(event.body || "{}");
          const input = validateDraftInput(body);
          if (input.error) return json(400, input);
          const now = new Date().toISOString();
          const draft = {
            id: randomUUID(),
            name: input.name,
            date: input.date,
            status: "active",
            items: input.items,
            createdAt: now,
            updatedAt: now,
          };
          await store.putJson(`${DRAFTS_PREFIX}${draft.id}.json`, draft);
          return json(201, draft);
        }
      }

      const draftMatch = path.match(
        /^\/api\/drafts\/([\w-]+)(\/finalize|\/share-image)?$/,
      );
      if (draftMatch) {
        const [, id, action] = draftMatch;
        const draftKey = `${DRAFTS_PREFIX}${id}.json`;

        if (action === "/finalize" && method === "POST") {
          return handleFinalize(id);
        }

        // Store the share card PNG rendered by the client after finalize
        if (action === "/share-image" && method === "POST") {
          const draft = await store.getJson(draftKey);
          if (!draft) return json(404, { error: "Draft not found" });
          if (draft.status !== "finalized") {
            return json(400, { error: "Publish the set before uploading its share image" });
          }
          if (!event.body) return json(400, { error: "Missing image body" });
          const image = Buffer.from(
            event.body,
            event.isBase64Encoded ? "base64" : "utf-8",
          );
          // PNG magic bytes — reject anything else
          if (image.length < 8 || image.readUInt32BE(0) !== 0x89504e47) {
            return json(400, { error: "Not a PNG image" });
          }
          if (image.length > 2 * 1024 * 1024) {
            return json(400, { error: "Image too large" });
          }
          const slug = toSlug(`${draft.date}-${draft.name}`);
          await store.putBinary(`share/${slug}.png`, image, "image/png");
          await invalidate(["/share/*"]);
          return json(200, {
            imageUrl: `https://${env.DOMAIN}/share/${slug}.png`,
          });
        }

        if (action) return json(404, { error: `No route for ${method} ${path}` });

        if (method === "GET") {
          const draft = await store.getJson(draftKey);
          return draft ? json(200, draft) : json(404, { error: "Draft not found" });
        }
        if (method === "PUT") {
          const draft = await store.getJson(draftKey);
          if (!draft) return json(404, { error: "Draft not found" });
          const body = JSON.parse(event.body || "{}");
          const input = validateDraftInput({ ...draft, ...body });
          if (input.error) return json(400, input);
          const updated = {
            ...draft,
            name: input.name,
            date: input.date,
            items: input.items,
            updatedAt: new Date().toISOString(),
          };
          await store.putJson(draftKey, updated);
          return json(200, updated);
        }
        if (method === "DELETE") {
          await store.remove(draftKey);
          return json(200, { ok: true });
        }
      }

      if (method === "POST" && path === "/api/upload-sbp") {
        return handleUploadSbp(event);
      }

      // Create a song directly (used by the quick-Salmo flow). Songs
      // normally arrive via .sbp upload; this covers website-authored ones.
      if (method === "POST" && path === "/api/songs") {
        const body = JSON.parse(event.body || "{}");
        const name = cleanName(body.name);
        const content = (body.content || "").trim();
        if (!name) return json(400, { error: "Song name is required" });
        if (!content) return json(400, { error: "Song content is required" });

        const lyrics = content.replace(/\[[^\]]+\]/g, "");
        const song = {
          Id: Date.now(),
          name,
          author: (body.author || "").trim(),
          subTitle: (body.subTitle || "").trim(),
          content,
          _tags: typeof body._tags === "string" ? body._tags : "[]",
          DeepSearch: `${name}\n${lyrics}`.toLowerCase(),
          hash: createHash("md5").update(content).digest("hex"),
          ModifiedDateTime: new Date().toISOString(),
          Deleted: false,
          type: 1,
          Url: "",
          Capo: 0,
        };

        // Explicit save: always overwrite the slug (unlike the .sbp merge,
        // which only replaces when ModifiedDateTime is newer)
        const existing = (await store.getJson(LIBRARY_KEY)) || [];
        const slug = toSlug(name);
        const stored = { ...song, slug };
        const songs = existing
          .filter((s) => (s.slug || toSlug(s.name)) !== slug)
          .concat(stored)
          .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        await store.putJson(LIBRARY_KEY, songs);
        await invalidate(["/files/library.json"]);

        return json(201, stored);
      }

      return json(404, { error: `No route for ${method} ${path}` });
    } catch (err) {
      console.error(err);
      return json(500, { error: "Internal error" });
    }
  };
}
