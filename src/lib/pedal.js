// Bluetooth foot pedals pair as keyboards and send ordinary key presses, but
// which keys varies by model and mode: AirTurn, PageFlip and Donner units
// default to arrows, PageUp/PageDown, or Space/Enter depending on the
// profile selected. These defaults accept all of them; "Learn" in the viewer
// settings narrows a direction to whatever the pedal actually sends.
export const DEFAULT_PEDAL = {
  mode: "page", // "page": scroll a screen, then next song at the end. "song": jump.
  forward: ["ArrowDown", "PageDown", "ArrowRight", " ", "Enter"],
  back: ["ArrowUp", "PageUp", "ArrowLeft", "Backspace"],
};

export function keyLabel(key) {
  if (key === " ") return "Space";
  return key.replace(/^Arrow/, "").replace(/^Page/, "Page ");
}
