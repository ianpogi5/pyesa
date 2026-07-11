function escapeHtml(s) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Render a static share page for a finalized set. Messenger/Facebook
 * crawlers read the Open Graph tags (they don't run JS); humans get
 * redirected into the app.
 */
export function renderSharePage({ domain, filename, name, date, songs }) {
  const appUrl = `https://${domain}/sets/${encodeURIComponent(filename)}`;
  const title = date ? `${name} — ${date}` : name;
  const songList = songs
    .map((song, i) => `${i + 1}. ${song.name}`)
    .join(" · ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} | Pyesa</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="PG Choir - Pyesa">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(songList)}">
<meta property="og:url" content="${escapeHtml(appUrl)}">
<meta name="description" content="${escapeHtml(songList)}">
<meta http-equiv="refresh" content="0;url=${escapeHtml(appUrl)}">
<style>body{font-family:system-ui,sans-serif;background:#1e1e2e;color:#cdd6f4;display:grid;place-items:center;min-height:100vh;margin:0;padding:1rem}a{color:#89b4fa}ol{line-height:1.8}</style>
</head>
<body>
<main>
<h1>${escapeHtml(title)}</h1>
<ol>${songs.map((song) => `<li>${escapeHtml(song.name)}</li>`).join("")}</ol>
<p><a href="${escapeHtml(appUrl)}">Open in Pyesa</a></p>
</main>
</body>
</html>
`;
}
