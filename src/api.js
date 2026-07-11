/**
 * Client for the set-builder API (Lambda behind CloudFront /api/*).
 * The shared passcode is remembered in localStorage and sent on every call.
 */

const KEY_STORAGE = "pyesa-key";

export function getPasscode() {
  return localStorage.getItem(KEY_STORAGE) || "";
}

export function setPasscode(key) {
  localStorage.setItem(KEY_STORAGE, key);
}

export function clearPasscode() {
  localStorage.removeItem(KEY_STORAGE);
}

export function isUnlocked() {
  return Boolean(getPasscode());
}

async function request(path, { method = "GET", body, raw } = {}) {
  const headers = { "x-pyesa-key": getPasscode() };
  let payload;
  if (raw !== undefined) {
    headers["content-type"] = "application/octet-stream";
    payload = raw;
  } else if (body !== undefined) {
    headers["content-type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(path, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  checkAuth: () => request("/api/auth/check"),
  listDrafts: () => request("/api/drafts"),
  createDraft: (draft) => request("/api/drafts", { method: "POST", body: draft }),
  getDraft: (id) => request(`/api/drafts/${id}`),
  updateDraft: (id, changes) =>
    request(`/api/drafts/${id}`, { method: "PUT", body: changes }),
  deleteDraft: (id) => request(`/api/drafts/${id}`, { method: "DELETE" }),
  finalizeDraft: (id) =>
    request(`/api/drafts/${id}/finalize`, { method: "POST" }),
  reopenDraft: (id) => request(`/api/drafts/${id}/reopen`, { method: "POST" }),
  uploadSbp: async (file) =>
    request("/api/upload-sbp", { method: "POST", raw: await file.arrayBuffer() }),
  createSong: (song) => request("/api/songs", { method: "POST", body: song }),
  uploadShareImage: async (draftId, blob) =>
    request(`/api/drafts/${draftId}/share-image`, {
      method: "POST",
      raw: await blob.arrayBuffer(),
    }),
};
