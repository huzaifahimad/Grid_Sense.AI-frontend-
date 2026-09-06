export const C = {
  field: "hsl(216 33% 4%)",
  panel: "hsl(216 30% 8%)",
  panelRaised: "hsl(216 28% 11%)",
  panelHover: "hsl(216 26% 14%)",
  line: "hsl(213 24% 18%)",
  lineBright: "hsl(213 24% 29%)",
  lineSoft: "hsl(213 22% 22%)",
  text: "hsl(210 33% 95%)",
  textDim: "hsl(212 23% 66%)",
  textFaint: "hsl(213 21% 38%)",
  textMuted: "hsl(214 19% 46%)",
  safe: "hsl(149 65% 54%)",
  safeGlow: "hsl(149 65% 64%)",
  caution: "hsl(37 100% 61%)",
  cautionGlow: "hsl(37 100% 71%)",
  critical: "hsl(5 100% 65%)",
  criticalGlow: "hsl(5 100% 75%)",
  cyan: "hsl(186 79% 56%)",
  cyanGlow: "hsl(186 79% 66%)",
  violet: "hsl(268 88% 71%)",
  violetGlow: "hsl(268 88% 81%)",
  gold: "hsl(45 100% 64%)",
  goldGlow: "hsl(45 100% 74%)",
};

export const FONT_BRAND = "'Orbitron', sans-serif";
export const FONT_DISPLAY = "'Chakra Petch', sans-serif";
export const FONT_HEADER = "'Rajdhani', sans-serif";
export const FONT_BODY = "'Work Sans', -apple-system, sans-serif";
export const FONT_MONO = "'Space Mono', monospace";

export function stateColor(status) {
  if (status === "critical") return C.critical;
  if (status === "elevated") return C.caution;
  return C.safe;
}

export function stateGlow(status) {
  if (status === "critical") return C.criticalGlow;
  if (status === "elevated") return C.cautionGlow;
  return C.safeGlow;
}

export function statusFromScore(score) {
  if (score >= 0.8) return "critical";
  if (score >= 0.6) return "elevated";
  return "normal";
}

export function hexFromChannel(channelColor) {
  return "#" + (channelColor || 0x35d6e8).toString(16).padStart(6, "0");
}

export function withAlpha(hslColor, alpha) {
  return hslColor.replace(/\)$/, ` / ${alpha})`);
}

export function colorWithAlpha(color, alpha) {
  if (typeof color !== "string") return color;
  if (color.startsWith("#")) {
    const alphaHex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0");
    return `${color}${alphaHex}`;
  }
  if (color.startsWith("var(")) {
    return `color-mix(in srgb, ${color}, transparent ${(1 - alpha) * 100}%)`;
  }
  return withAlpha(color, alpha);
}
