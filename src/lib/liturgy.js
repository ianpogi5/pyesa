/**
 * Suggest a set name from the liturgical calendar (e.g. picking
 * 2026-07-12 suggests "15th Sunday in Ordinary Time").
 *
 * Looks up the static /liturgy.json generated at build time by
 * scripts/generate-liturgy.js (romcal can't run in the browser).
 */

let daysPromise = null;

function loadDays() {
  if (!daysPromise) {
    daysPromise = fetch("/liturgy.json")
      .then((res) => (res.ok ? res.json() : {}))
      .catch(() => ({}));
  }
  return daysPromise;
}

export async function suggestSetName(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return "";
  const days = await loadDays();
  return days[dateStr] || "";
}
