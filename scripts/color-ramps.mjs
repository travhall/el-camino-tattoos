// Color primitives. Generates the ramps in src/styles/palette.css.
//
//   1. Each primitive (paper, ink, gold, red, green, navy) is a tonal ramp. You
//      pin the exact brand values to the steps you want; the steps between and
//      beyond the pins are generated in OKLCH (even lightness, hue held, chroma
//      eased at the ends, gamut-clipped). Pin more steps for more control.
//   2. Semantic roles (background, foreground, accent, ...) are NOT made here.
//      They are hand-edited in src/styles/roles.css, which points at steps of
//      these ramps. Contrast is checked separately: `pnpm check:contrast`.
//
// Re-theme the primitives: change the pinned hex values below, then run
// `pnpm color-ramps`. Ramp names (gold, red, ...) live only in this file, the
// generated palette and roles.css; components use roles.
import { writeFile } from "node:fs/promises";

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// Primitives, named by color. Sailor Jerry style: paper, ink black, and the
// four flash colors. Pins are exact brand values; the rest is generated.
//
// Keep ramps smooth: pin as few steps as you can, and pin each brand color at
// the step whose lightness is closest to its own (a light gold belongs near 300,
// not 500). The generator spaces lightness evenly between and beyond pins, so
// pins that are unevenly spaced in lightness make a ramp lurch. The report at
// the end of `pnpm color-ramps` flags any ramp that does.
const ramps = {
  // Neutral paper: canvas, raised surfaces, dividers, and dark-mode text. Only
  // the two lightest steps are pinned; the rest steps evenly down to black.
  paper: { pins: { 50: "#f7f7f5", 100: "#ebeae6" } },
  // Warm black: light-mode text, dark-mode canvas and surfaces.
  ink: { pins: { 700: "#55483a", 950: "#0b0a09" } },
  // Mustard gold: primary actions. Sits high in lightness, so it lives at 300.
  gold: { pins: { 300: "#e9ac1f" } },
  // Tattoo red: emphasis and state indicators.
  red: { pins: { 600: "#bf2a2e" } },
  // Deep green. Not mapped to a role yet.
  green: { pins: { 400: "#4aa172" } },
  // Navy: focus ring.
  navy: { pins: { 400: "#7aa2d6" } },
};

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

// ---- ramp generation -----------------------------------------------------
// The ends of every ramp. Step 950 is the darkest. Steps 50 and 100 (unless you
// pin them) are a soft tint of the ramp's own color, at a fraction of its
// chroma, so a ramp opens with a small step instead of jumping from
// near-white to a full tint. Below 100, lightness runs evenly to the darkest.
const DARKEST = 0.12;
const LIGHT_END = [
  { index: 0, L: 0.98, chroma: 0.4 },
  { index: 1, L: 0.925, chroma: 0.65 },
];

function buildRamp({ pins }) {
  const pinned = Object.entries(pins)
    .map(([step, hex]) => ({
      index: STEPS.indexOf(Number(step)),
      hex,
      ...rgbToOklch(hexToRgb(hex)),
    }))
    .sort((p, q) => p.index - q.index);

  const ref = pinned.find((p) => p.index >= 2) ?? pinned[0];
  for (const { index, L, chroma } of LIGHT_END) {
    if (!pinned.some((p) => p.index === index)) {
      pinned.push({ index, hex: null, L, C: ref.C * chroma, h: ref.h });
    }
  }
  pinned.sort((p, q) => p.index - q.index);

  const last = pinned[pinned.length - 1];
  const lastIndex = STEPS.length - 1;

  const ramp = {};
  STEPS.forEach((step, index) => {
    const exact = pinned.find((p) => p.index === index);
    if (exact) {
      ramp[step] = exact.hex ?? toHex(exact);
      return;
    }
    let L;
    let C;
    let h;
    if (index > last.index) {
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

// ---- smoothness report ---------------------------------------------------
// Warns (never fails) when a ramp's lightness steps are uneven, which reads as
// the ramp "jumping". The first interval is skipped: paper's canvas steps are
// deliberately close together.
const stepsOf = (ramp) => {
  const l = STEPS.map((step) => rgbToOklch(hexToRgb(ramp[step])).L);
  return l.slice(1).map((v, i) => l[i] - v);
};
for (const [name, ramp] of Object.entries(built)) {
  const d = stepsOf(ramp).slice(1);
  const ratio = Math.max(...d) / Math.min(...d);
  if (ratio > 1.5) {
    console.warn(
      `color-ramps: ${name} ramp is uneven (largest lightness step is ${ratio.toFixed(1)}x the smallest). Check its pins.`,
    );
  }
}

// ---- output --------------------------------------------------------------
const rampVars = Object.entries(built).flatMap(([name, ramp]) =>
  Object.entries(ramp).map(([step, hex]) => `  --${name}-${step}: ${hex};`),
);

const css = [
  "/* Generated by scripts/color-ramps.mjs. Do not edit; run `pnpm color-ramps`. */",
  "/* Primitive ramps only. Roles are hand-edited in roles.css. */",
  ":root {",
  ...rampVars,
  "}",
  "",
].join("\n");

const json = { steps: STEPS, ramps: built };

await writeFile("src/styles/palette.css", css);
await writeFile(
  "src/styles/palette.generated.json",
  `${JSON.stringify(json, null, 2)}\n`,
);
console.log(`color-ramps: ${Object.keys(built).length} ramps written.`);
