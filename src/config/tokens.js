export const C = {
  field: "#080B10",
  panel: "#0E141C",
  panelRaised: "#141C27",
  line: "#232D3A",
  lineBright: "#37475C",
  text: "#EAF0F5",
  textDim: "#94A6BA",
  textFaint: "#4E6076",
  safe: "#3ED67D",
  caution: "#FFB238",
  critical: "#FF5A4A",
  cyan: "#35D6E8",
  violet: "#B478F5",
  gold: "#FFD54A",
};

export const FONT_HERO = "'Orbitron', sans-serif";
export const FONT_HEADER = "'Rajdhani', sans-serif";
export const FONT_BODY = "'Work Sans', -apple-system, sans-serif";
export const FONT_MONO = "'Space Mono', monospace";

export function stateColor(status) {
  if (status === "critical") return C.critical;
  if (status === "elevated") return C.caution;
  return C.safe;
}
