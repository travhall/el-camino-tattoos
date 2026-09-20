// Brand color ramps and semantic roles. Single source of truth for color.
//
//   1. Each brand color is "pinned" to a step of a tonal ramp; the other steps
//      are generated in OKLCH (even lightness, hue held, chroma eased at the
//      ends, gamut-clipped).
//   2. Roles (background, foreground, muted, ...) pick steps from the ramps,
//      separately for light and dark.
//   3. Every role pairing is checked against a WCAG contrast target. The
//      script FAILS (no files written) if any pairing misses, so contrast
//      can't silently regress when a color changes.
//
// Re-theme: change the pinned hex values (or the role picks) below, then run
// `pnpm color-ramps`. Nothing else in the codebase names a color.
import { writeFile } from "node:fs/promises";

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// Ramp names are roles of a color family, not hues.
const ramps = {
  // Text and primary actions.
  ink: { pins: { 700: "#344f1f" } },
  // Highlights.
  accent: { pins: { 500: "#f4991a" } },
  // Canvas and raised surfaces (warm neutral).
  paper: { pins: { 50: "#f9f5f0", 100: "#f2ead3" } },
};

// step picks are "ramp.step".
const roles = {
  light: {
    background: "paper.50",
    surface: "paper.100",
    foreground: "ink.900",
    muted: "ink.600",
    outline: "ink.500",
    line: "paper.200",
    hover: "paper.200",
    accent: "accent.500",
    "accent-foreground": "ink.900",
    "accent-text": "accent.700",
    "accent-soft": "accent.100",
    focus: "accent.700",
  },
  dark: {
    background: "paper.950",
    surface: "paper.800",
    foreground: "ink.50",
    muted: "paper.200",
    outline: "paper.400",
    line: "ink.700",
    hover: "ink.700",
    accent: "accent.500",
    "accent-foreground": "ink.900",
    "accent-text": "accent.400",
    "accent-soft": "accent.900",
    focus: "accent.400",
  },
};

// [foreground role, background role, minimum WCAG ratio, what it covers]
const pairs = [
  ["foreground", "background", 7, "body text"],
  ["foreground", "surface", 7, "text on surface"],
  ["foreground", "hover", 4.5, "text on hover fill"],
  ["muted", "background", 4.5, "secondary text"],
  ["muted", "surface", 4.5, "secondary text on surface"],
  ["outline", "background", 3, "input and chip borders"],
  ["outline", "surface", 3, "borders on surface"],
  ["accent-text", "background", 4.5, "accent text and links"],
  ["accent-text", "surface", 4.5, "accent text on surface"],
  ["focus", "background", 3, "focus ring"],
  ["focus", "surface", 3, "focus ring on surface"],
  ["accent-foreground", "accent", 4.5, "text on accent fill"],
  ["foreground", "accent-soft", 4.5, "text on soft accent"],
];

// ---- color math ----------------------------------------------------------
const toLinear = (c) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const fromLinear = (c) =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;

function hexToRgb(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
}

const rgbToHex = (rgb) =>
  `#${rgb
    .map((v) =>
      Math.round(Math.min(1, Math.max(0, v)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

function rgbToOklch(rgb) {
  const [r, g, b] = rgb.map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(a, bb), h: Math.atan2(bb, a) };
}

function oklchToRgb({ L, C, h }) {
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = (rgb) => rgb.every((v) => v >= -0.0005 && v <= 1.0005);

// Reduce chroma until the color fits in sRGB.
function toHex({ L, C, h }) {
  let lo = 0;
  let hi = C;
  let rgb = oklchToRgb({ L, C, h });
  if (!inGamut(rgb)) {
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToRgb({ L, C: mid, h }))) lo = mid;
      else hi = mid;
    }
    rgb = oklchToRgb({ L, C: lo, h });
  }
  return rgbToHex(rgb.map(fromLinear));
}

const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// ---- ramp generation -----------------------------------------------------
const LIGHTEST = 0.985;
const DARKEST = 0.16;

function buildRamp({ pins }) {
  const pinned = Object.entries(pins)
    .map(([step, hex]) => ({
      index: STEPS.indexOf(Number(step)),
      hex,
      ...rgbToOklch(hexToRgb(hex)),
    }))
    .sort((p, q) => p.index - q.index);

  const first = pinned[0];
  const last = pinned[pinned.length - 1];
  const lastIndex = STEPS.length - 1;

  const ramp = {};
  STEPS.forEach((step, index) => {
    const exact = pinned.find((p) => p.index === index);
    if (exact) {
      ramp[step] = exact.hex;
      return;
    }
    let L;
    let C;
    let h;
    if (index < first.index) {
      const t = index / first.index; // 0 = lightest end
      L = LIGHTEST + (first.L - LIGHTEST) * t;
      C = first.C * (0.25 + 0.75 * t);
      h = first.h;
    } else if (index > last.index) {
      const t = (index - last.index) / (lastIndex - last.index);
      L = last.L + (DARKEST - last.L) * t;
      C = last.C * (1 - 0.35 * t);
      h = last.h;
    } else {
      const lower = [...pinned].reverse().find((p) => p.index < index);
      const upper = pinned.find((p) => p.index > index);
      const t = (index - lower.index) / (upper.index - lower.index);
      L = lower.L + (upper.L - lower.L) * t;
      C = lower.C + (upper.C - lower.C) * t;
      h = lower.h + (upper.h - lower.h) * t;
    }
    ramp[step] = toHex({ L, C, h });
  });
  return ramp;
}

const built = Object.fromEntries(
  Object.entries(ramps).map(([name, def]) => [name, buildRamp(def)]),
);

const pick = (ref) => {
  const [name, step] = ref.split(".");
  const hex = built[name]?.[step];
  if (!hex) throw new Error(`Unknown ramp step: ${ref}`);
  return hex;
};

// ---- contrast check ------------------------------------------------------
const results = [];
let failures = 0;
for (const [fg, bg, min, note] of pairs) {
  const row = { fg, bg, min, note };
  for (const theme of ["light", "dark"]) {
    const ratio = contrast(pick(roles[theme][fg]), pick(roles[theme][bg]));
    row[theme] = Math.round(ratio * 100) / 100;
    if (ratio < min) {
      failures++;
      console.error(
        `FAIL ${theme}: ${fg} (${roles[theme][fg]}) on ${bg} (${roles[theme][bg]}) = ${ratio.toFixed(2)}, needs ${min}`,
      );
    }
  }
  results.push(row);
}

if (failures > 0) {
  console.error(
    `\ncolor-ramps: ${failures} contrast failure(s); nothing written.`,
  );
  process.exit(1);
}

// ---- output --------------------------------------------------------------
const rampVars = Object.entries(built).flatMap(([name, ramp]) =>
  Object.entries(ramp).map(([step, hex]) => `  --${name}-${step}: ${hex};`),
);

const roleVars = (theme) =>
  Object.entries(roles[theme]).map(([role, ref]) => {
    const [name, step] = ref.split(".");
    return `  --${role}: var(--${name}-${step});`;
  });

const css = [
  "/* Generated by scripts/color-ramps.mjs. Do not edit; run `pnpm color-ramps`. */",
  ":root {",
  "  /* Ramps */",
  ...rampVars,
  "",
  "  /* Roles: light */",
  ...roleVars("light"),
  "}",
  "",
  "@media (prefers-color-scheme: dark) {",
  "  :root {",
  ...roleVars("dark").map((line) => `  ${line}`),
  "  }",
  "}",
  "",
].join("\n");

const json = {
  steps: STEPS,
  ramps: built,
  roles: {
    light: Object.fromEntries(
      Object.entries(roles.light).map(([r, ref]) => [
        r,
        { ref, hex: pick(ref) },
      ]),
    ),
    dark: Object.fromEntries(
      Object.entries(roles.dark).map(([r, ref]) => [
        r,
        { ref, hex: pick(ref) },
      ]),
    ),
  },
  pairs: results,
};

await writeFile("src/styles/palette.css", css);
await writeFile(
  "src/styles/palette.generated.json",
  `${JSON.stringify(json, null, 2)}\n`,
);
console.log(
  `color-ramps: ${Object.keys(built).length} ramps, ${pairs.length} pairings x 2 themes, all pass.`,
);
