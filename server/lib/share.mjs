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
export function renderSharePage({ domain, filename, name, date, songs, imageUrl, slug }) {
  const appUrl = `https://${domain}/sets/${encodeURIComponent(filename)}`;
  // og:url must be the share page itself — Facebook scrapes the canonical
  // URL's tags, and the app URL is a bare SPA shell with none.
  const pageUrl = `https://${domain}/share/${slug}.html`;
  const title = date ? `${name} — ${date}` : name;
  const songList = songs
    .map((song, i) => `${i + 1}. ${song.name}`)
    .join(" · ");
  const imageTags = imageUrl
    ? `
<meta property="og:image" content="${escapeHtml(imageUrl)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">`
    : "";

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
<meta property="og:url" content="${escapeHtml(pageUrl)}">${imageTags}
<meta name="description" content="${escapeHtml(songList)}">
<script>location.replace(${JSON.stringify(appUrl)});</script>
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
