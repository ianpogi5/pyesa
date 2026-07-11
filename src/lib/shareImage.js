/**
 * Renders the Messenger/Facebook share card (og:image) for a published
 * set: 1200x1200 PNG with the full numbered song list. Square renders
 * roughly twice as tall as landscape in a phone Messenger bubble (the
 * primary surface) without getting cropped on other Facebook surfaces.
 * Rendered in the browser at publish time (canvas), so the Lambda stays
 * dependency-free.
 */

export const SHARE_IMAGE_SIZE = 1200;

const W = SHARE_IMAGE_SIZE;
const H = SHARE_IMAGE_SIZE;
const MARGIN = 72;

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
  ctx.fillRect(0, 0, W, 220);
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(0, 220, W, 5);

  // Eyebrow
  ctx.fillStyle = COLORS.blue;
  ctx.font = `700 32px ${FONT}`;
  ctx.fillText("PG CHOIR  ·  PYESA", MARGIN, 84);

  // Title (shrink to fit) + date
  let titleSize = 64;
  ctx.font = `800 ${titleSize}px ${FONT}`;
  while (ctx.measureText(name).width > W - MARGIN * 2 && titleSize > 36) {
    titleSize -= 2;
    ctx.font = `800 ${titleSize}px ${FONT}`;
  }
  ctx.fillStyle = COLORS.text;
  ctx.fillText(name, MARGIN, 156);
  ctx.fillStyle = COLORS.subtext;
  ctx.font = `500 34px ${FONT}`;
  ctx.fillText(formatDate(date), MARGIN, 200);

  // Song list: one big readable column (typical sets are 10–14 songs)
  const listTop = 300;
  const listBottom = H - 110;
  const maxShown = 18;
  const shown = songs.slice(0, maxShown);
  const lineHeight = Math.min(64, Math.floor((listBottom - listTop) / shown.length));
  const size = Math.min(44, lineHeight - 14);

  shown.forEach((song, i) => {
    const y = listTop + i * lineHeight;

    ctx.fillStyle = COLORS.blue;
    ctx.font = `700 ${size - 8}px ${FONT}`;
    ctx.fillText(String(i + 1).padStart(2, " "), MARGIN, y);

    ctx.fillStyle = COLORS.text;
    ctx.font = `600 ${size}px ${FONT}`;
    ctx.fillText(truncate(ctx, song, W - MARGIN * 2 - 72), MARGIN + 72, y);
  });

  if (songs.length > shown.length) {
    ctx.fillStyle = COLORS.subtext;
    ctx.font = `500 32px ${FONT}`;
    ctx.fillText(`+ ${songs.length - shown.length} more`, MARGIN, listBottom + 44);
  }

  // Footer
  ctx.fillStyle = COLORS.surface;
  ctx.fillRect(0, H - 72, W, 72);
  ctx.fillStyle = COLORS.subtext;
  ctx.font = `500 28px ${FONT}`;
  ctx.fillText("pyesa.kdc.sh", MARGIN, H - 26);

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
