export const C = {
  field: "hsl(216 33% 4%)",
  panel: "hsl(216 30% 8%)",
  panelRaised: "hsl(216 28% 11%)",
  panelHover: "hsl(216 26% 14%)",
  line: "hsl(213 24% 18%)",
  lineBright: "hsl(213 24% 29%)",
  lineSoft: "hsl(213 22% 22%)",
  text: "hsl(210 33% 95%)",
  textDim: "hsl(212 26% 70%)",
  textMuted: "hsl(214 22% 60%)",
  textFaint: "hsl(213 21% 54%)",
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
export const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

// Status must never be carried by colour alone, so each level ships a glyph,
// a plain-text label and the threshold that produced it.
export const STATUS_META = {
  normal: { color: C.safe, glow: C.safeGlow, icon: "shield", label: "Normal" },
  elevated: { color: C.caution, glow: C.cautionGlow, icon: "alert", label: "Elevated" },
  critical: { color: C.critical, glow: C.criticalGlow, icon: "bolt", label: "Critical" },
};

export const STAGGER_MS = 45;

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

// One rounding rule for every risk readout. Overnight scores are far below 1%,
// and "0%" reads as missing data rather than low risk, so anything under a
// tenth of a percent is shown as a floor with a "<".
export function riskPercent(score) {
  const pct = Number.isFinite(score) ? score * 100 : 0;
  if (pct > 0 && pct < 0.1) return { pct, shown: 0.1, decimals: 1, prefix: "<" };
  return { pct, shown: pct, decimals: pct < 1 ? 2 : 0, prefix: "" };
}

export function riskPercentText(score) {
  const { shown, decimals, prefix } = riskPercent(score);
  return `${prefix}${shown.toFixed(decimals)}`;
}

export function riskPercentWords(score) {
  const { pct, decimals, prefix } = riskPercent(score);
  return prefix ? "less than 0.1" : pct.toFixed(decimals);
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

// three's Color parser only accepts legacy comma-separated hsl()/rgb(). Our tokens
// use the modern space-separated CSS syntax, which it silently resolves to white —
// so passing C.critical straight into `new THREE.Color()` lost every risk colour.
export function toThreeColor(cssColor) {
  if (typeof cssColor !== "string") return cssColor;
  if (cssColor.startsWith("#")) return cssColor;
  const open = cssColor.indexOf("(");
  if (open === -1) return cssColor;
  const inner = cssColor.slice(open + 1, cssColor.lastIndexOf(")"));
  return `${cssColor.slice(0, open + 1)}${inner.split("/")[0].trim().replace(/\s+/g, ", ")})`;
}
