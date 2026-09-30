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
//
// A ramp may also set `darkHue` (degrees) to drift its hue toward that value
// past its last pin; without it the hue is held.
const ramps = {
  // Warm paper: canvas, surfaces, dividers and hover fills in both modes. One
  // faint cream hue the whole way down (about a third of the original cream's
  // chroma): light mode is warm off-white, dark mode a warm charcoal. 950 sits
  // at the lightness the old navy had, so dark-mode contrast barely moved.
  paper: { pins: { 50: "#f9f7f1", 100: "#eeeae1", 950: "#090704" } },
  // Neutral black: text and strokes in both modes (foreground, muted, outline).
  // Only a trace of cool tint, so it sits quietly on the paper.
  ink: { pins: { 700: "#484b4f", 950: "#090a0c" } },
  // Mustard gold: the brand accent, and warning (its amber end). Sits high in
  // lightness, so it lives at 300. Its hue drifts toward amber (62) as it
  // darkens, so hover, mark and text steps read as gold-brown rather than olive.
  gold: { pins: { 300: "#e9ac1f" }, darkHue: 62 },
  // Tattoo red: error, and nothing else.
  red: { pins: { 600: "#bf2a2e" } },
  // Deep green: success (open, available, done).
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

// Display P3 has a wider gamut than sRGB, so a step whose OKLCH chroma got
// clipped to fit sRGB (gold and red especially — see the P3 report below)
// can render more saturated on a P3 screen. Chain through XYZ (D65, standard
// matrices) rather than deriving an OKLab->P3 matrix directly: oklchToRgb
// already gives linear sRGB, and both sRGB->XYZ and XYZ->linear-P3 are
// well-known constants. Display P3 shares sRGB's transfer function, so the
// same `fromLinear` gamma-encodes it.
const srgbLinearToXyz = ([r, g, b]) => [
  0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
  0.2126729 * r + 0.7151522 * g + 0.072175 * b,
  0.0193339 * r + 0.119192 * g + 0.9503041 * b,
];
const xyzToP3Linear = ([x, y, z]) => [
  2.4934969119 * x - 0.9313836179 * y - 0.4027107845 * z,
  -0.8294889696 * x + 1.7626640603 * y + 0.0236246858 * z,
  0.0358458302 * x - 0.0761723893 * y + 0.956884524 * z,
];
const oklchToP3Linear = (oklch) =>
  xyzToP3Linear(srgbLinearToXyz(oklchToRgb(oklch)));

// Same binary-search chroma reduction as toHex, gamut-checked against P3
// instead of sRGB. Returns [r, g, b] in 0-1, gamma-encoded.
function toP3({ L, C, h }) {
  let lo = 0;
  let hi = C;
  let rgb = oklchToP3Linear({ L, C, h });
  if (!inGamut(rgb)) {
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToP3Linear({ L, C: mid, h }))) lo = mid;
      else hi = mid;
    }
    rgb = oklchToP3Linear({ L, C: lo, h });
  }
  return rgb.map(fromLinear).map((v) => Math.min(1, Math.max(0, v)));
}

const fmt = (v) => {
  const s = v.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return s === "" || s === "-0" ? "0" : s;
};
const toP3Literal = (oklch) =>
  `color(display-p3 ${toP3(oklch).map(fmt).join(" ")})`;

// True (unclipped) test of whether toHex would have had to reduce this
// color's chroma to fit sRGB — i.e. whether P3 has any extra saturation to
// offer here at all. Comparing rendered literals instead would misfire on
// sub-quantum rounding noise from hex's 8-bit round-trip.
const neededSrgbClip = ({ L, C, h }) => !inGamut(oklchToRgb({ L, C, h }));

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

function buildRamp({ pins, darkHue }) {
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
  const oklch = {};
  STEPS.forEach((step, index) => {
    const exact = pinned.find((p) => p.index === index);
    if (exact) {
      ramp[step] = exact.hex ?? toHex(exact);
      oklch[step] = { L: exact.L, C: exact.C, h: exact.h };
      return;
    }
    let L;
    let C;
    let h;
    if (index > last.index) {
      const t = (index - last.index) / (lastIndex - last.index);
      L = last.L + (DARKEST - last.L) * t;
      C = last.C * (1 - 0.35 * t);
      // Optional: drift toward darkHue (degrees) as the ramp darkens, fast at
      // first then settling, so darker steps warm instead of going olive.
      h =
        darkHue === undefined
          ? last.h
          : last.h + ((darkHue * Math.PI) / 180 - last.h) * (1 - (1 - t) ** 2);
    } else {
      const lower = [...pinned].reverse().find((p) => p.index < index);
      const upper = pinned.find((p) => p.index > index);
      const t = (index - lower.index) / (upper.index - lower.index);
      L = lower.L + (upper.L - lower.L) * t;
      C = lower.C + (upper.C - lower.C) * t;
      h = lower.h + (upper.h - lower.h) * t;
    }
    ramp[step] = toHex({ L, C, h });
    oklch[step] = { L, C, h };
  });
  return { ramp, oklch };
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
for (const [name, { ramp }] of Object.entries(built)) {
  const d = stepsOf(ramp).slice(1);
  const ratio = Math.max(...d) / Math.min(...d);
  if (ratio > 1.5) {
    console.warn(
      `color-ramps: ${name} ramp is uneven (largest lightness step is ${ratio.toFixed(1)}x the smallest). Check its pins.`,
    );
  }
}

// ---- output --------------------------------------------------------------
const rampVars = Object.entries(built).flatMap(([name, { ramp }]) =>
  Object.entries(ramp).map(([step, hex]) => `  --${name}-${step}: ${hex};`),
);

// A step's un-clipped OKLCH chroma may exceed sRGB's gamut but still fit
// Display P3's wider one — that step gets a P3 override with more
// saturation than its hex. Steps that never needed sRGB clipping have
// nothing extra to gain from P3, so they're skipped.
const p3Vars = Object.entries(built).flatMap(([name, { oklch }]) =>
  STEPS.flatMap((step) =>
    neededSrgbClip(oklch[step])
      ? [`    --${name}-${step}: ${toP3Literal(oklch[step])};`]
      : [],
  ),
);

const css = [
  "/* Generated by scripts/color-ramps.mjs. Do not edit; run `pnpm color-ramps`. */",
  "/* Primitive ramps only. Roles are hand-edited in roles.css. */",
  ":root {",
  ...rampVars,
  "}",
  ...(p3Vars.length === 0
    ? []
    : [
        "",
        "/* Display P3 override: only the steps whose un-clipped OKLCH chroma",
        "   exceeds sRGB's gamut but fits P3's, so a wide-gamut screen shows a",
        "   more saturated color than the hex above. Same palette, wider gamut. */",
        "@supports (color: color(display-p3 1 1 1)) {",
        "  @media (color-gamut: p3) {",
        "    :root {",
        ...p3Vars,
        "    }",
        "  }",
        "}",
      ]),
  "",
].join("\n");

const json = {
  steps: STEPS,
  ramps: Object.fromEntries(
    Object.entries(built).map(([name, { ramp }]) => [name, ramp]),
  ),
};

console.log(
  `color-ramps: ${p3Vars.length} step(s) gain extra saturation on Display P3.`,
);

await writeFile("src/styles/palette.css", css);
await writeFile(
  "src/styles/palette.generated.json",
  `${JSON.stringify(json, null, 2)}\n`,
);
console.log(`color-ramps: ${Object.keys(built).length} ramps written.`);
