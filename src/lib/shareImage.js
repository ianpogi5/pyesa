/**
 * Renders the Messenger/Facebook share card (og:image) for a published
 * set: 1200x630 PNG with the full numbered song list. Rendered in the
 * browser at publish time (canvas), so the Lambda stays dependency-free.
 *
 * Deliberately landscape (1.91:1): Messenger GROUP chats center-crop
 * taller images (a square card loses its title and last songs there),
 * and the choir group chat is the primary share destination. Individual
 * chats render it smaller but complete. Don't switch to square/portrait
 * without checking a group-chat preview first.
 */

const W = 1200;
const H = 630;
const MARGIN = 64;

// Catppuccin mocha (the app's dark theme)
const COLORS = {
  bg: "#1e1e2e",
  panel: "#181825",
  text: "#cdd6f4",
  subtext: "#9399b2",
  blue: "#89b4fa",
  surface: "#313244",
};

const FONT = "-apple-system, 'Segoe UI', Roboto, 'Inter', sans-serif";

export async function buildShareImageBlob({ name, date, songs }) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background with a subtle top panel
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(0, 0, W, 172);
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(0, 172, W, 4);

  // Eyebrow
  ctx.fillStyle = COLORS.blue;
  ctx.font = `700 24px ${FONT}`;
  ctx.fillText("PG CHOIR  ·  PYESA", MARGIN, 64);

  // Title (shrink to fit) + date
  let titleSize = 54;
  ctx.font = `800 ${titleSize}px ${FONT}`;
  while (ctx.measureText(name).width > W - MARGIN * 2 && titleSize > 30) {
    titleSize -= 2;
    ctx.font = `800 ${titleSize}px ${FONT}`;
  }
  ctx.fillStyle = COLORS.text;
  ctx.fillText(name, MARGIN, 124);
  ctx.fillStyle = COLORS.subtext;
  ctx.font = `500 26px ${FONT}`;
  ctx.fillText(formatDate(date), MARGIN, 160);

  // Song list: one column up to 8 songs, two columns up to 16, then "+N more"
  const listTop = 232;
  const listBottom = H - 72;
  const twoCols = songs.length > 8;
  const perCol = twoCols ? 8 : songs.length;
  const shown = songs.slice(0, twoCols ? 16 : 8);
  const lineHeight = Math.min(52, Math.floor((listBottom - listTop) / perCol));
  const colWidth = twoCols ? (W - MARGIN * 2 - 48) / 2 : W - MARGIN * 2;
  const size = twoCols ? 28 : 32;

  shown.forEach((song, i) => {
    const col = Math.floor(i / perCol);
    const row = i % perCol;
    const x = MARGIN + col * (colWidth + 48);
    const y = listTop + row * lineHeight;

    ctx.fillStyle = COLORS.blue;
    ctx.font = `700 ${size - 6}px ${FONT}`;
    ctx.fillText(String(i + 1).padStart(2, " "), x, y);

    ctx.fillStyle = COLORS.text;
    ctx.font = `600 ${size}px ${FONT}`;
    ctx.fillText(truncate(ctx, song, colWidth - 56), x + 52, y);
  });

  if (songs.length > shown.length) {
    ctx.fillStyle = COLORS.subtext;
    ctx.font = `500 26px ${FONT}`;
    ctx.fillText(
      `+ ${songs.length - shown.length} more`,
      MARGIN,
      listBottom + 40,
    );
  }

  // Footer
  ctx.fillStyle = COLORS.surface;
  ctx.fillRect(0, H - 56, W, 56);
  ctx.fillStyle = COLORS.subtext;
  ctx.font = `500 22px ${FONT}`;
  ctx.fillText("pyesa.kdc.sh", MARGIN, H - 20);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("canvas toBlob failed"))),
      "image/png",
    );
  });
}

function truncate(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

function formatDate(iso) {
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
