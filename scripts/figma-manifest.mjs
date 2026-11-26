/**
 * Writes figma/manifest.json: every design token the Figma file mirrors, in
 * one file, with a short hash. Figma is a mirror of the code, so this is the
 * hand-off: after changing roles.css, a ramp pin, the type scale or a layout
 * value, run `pnpm figma-manifest` and ask Claude to "re-sync Figma". The hash
 * is stored in the Figma file, so a stale mirror is easy to spot.
 *
 * Reads (never edit the outputs):
 *   src/styles/palette.generated.json   primitive ramps
 *   src/styles/roles.css                semantic roles (one dark theme)
 *   src/styles/type-scale.generated.json  fluid type and space scale
 *   src/app/globals.css                 motion tokens
 *   src/lib/fonts.ts                    fonts (checked, names are listed below)
 * Layout values are named below because they live in Tailwind utilities on
 * the components rather than in variables; `source` says where each one is used.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCssVarRoles } from "./lib/parse-css-vars.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const palette = JSON.parse(read("src/styles/palette.generated.json"));
const typeScale = JSON.parse(read("src/styles/type-scale.generated.json"));

/**
 * `var(--gold-300)` or `#hex` to { ref, hex }. A UI token may point at another
 * role (`var(--accent-mark)`): that resolves through the role for the same
 * mode and adds `alias`, so the Figma variable can alias the role variable.
 */
function resolve(value, vars, depth = 0) {
  const ref = value.match(/^var\(--([a-z]+)-(\d+)\)$/);
  if (ref) {
    const hex = palette.ramps[ref[1]]?.[ref[2]];
    if (!hex) throw new Error(`roles.css points at a missing step: ${value}`);
    return { ref: `${ref[1]}-${ref[2]}`, hex };
  }
  const role = value.match(/^var\(--([a-z-]+)\)$/);
  if (role && vars[role[1]] && depth < 5)
    return { ...resolve(vars[role[1]], vars, depth + 1), alias: role[1] };
  if (/^#[0-9a-f]{6}$/i.test(value))
    return { ref: null, hex: value.toLowerCase() };
  throw new Error(`roles.css: cannot resolve "${value}"`);
}

const parsed = parseCssVarRoles(read("src/styles/roles.css"));
const roles = Object.fromEntries(
  Object.keys(parsed).map((name) => [name, resolve(parsed[name], parsed)]),
);

const motionCss = read("src/app/globals.css");
const motion = Object.fromEntries(
  [...motionCss.matchAll(/--(duration-[a-z]+|ease-out):\s*([^;]+);/g)].map(
    (m) => [m[1], m[2].trim()],
  ),
);

/** Values in px. `source` is where the value is used in the code. */
const layout = {
  "max-width/page": { px: 1440, source: ".page (--page-max, 90rem)" },
  "max-width/form": { px: 576, source: ".contact-form (max-w-xl)" },
  "max-width/viewer": { px: 1024, source: ".viewer (64rem)" },
  "max-width/hero-intro": { px: 680, source: ".hero__intro (42.5rem)" },
  "size/hero-media-width": {
    px: 420,
    source: ".hero--image-left/right photo column from lg (26.25rem)",
  },
  "size/target-min": { px: 44, source: "min-h-11, the touch target minimum" },
  "radius/control": {
    px: 8,
    source:
      ".button, .filter-chip, .field__control, .form-status, .skip-link (rounded-control)",
  },
  "radius/media": {
    px: 12,
    source:
      ".piece-tile__media, .artist-card__media, .piece-detail__media (rounded-media)",
  },
  "radius/panel": { px: 16, source: ".viewer (rounded-panel)" },
  "radius/feature": {
    px: 24,
    source: ".artist-profile__photo, .hero__media (rounded-feature)",
  },
  "radius/pill": {
    px: 9999,
    source: "status dots, round icons (rounded-full)",
  },
  // Fixed (non-fluid) spacing inside controls: Tailwind's 4px steps (px-4,
  // py-1.5, gap-2...). Layout spacing between blocks is the fluid scale.
  "space/fixed/4": { px: 4, source: ".button--sm (py-1), .field (gap-1)" },
  "space/fixed/6": { px: 6, source: ".button, .filter-chip (py-1.5)" },
  "space/fixed/8": {
    px: 8,
    source: ".button, .check (gap-2), .field__control, .form-status (py-2)",
  },
  "space/fixed/10": { px: 10, source: ".button--lg (py-2.5)" },
  "space/fixed/12": {
    px: 12,
    source: ".button--sm, .field__control, .form-status (px-3)",
  },
  "space/fixed/16": { px: 16, source: ".button, .filter-chip (px-4)" },
  "space/fixed/24": { px: 24, source: ".button--lg (px-6)" },
  "border/width": { px: 1, source: "controls (border)" },
  "focus/ring-width": { px: 2, source: ":focus-visible outline" },
  "focus/ring-offset": { px: 2, source: ":focus-visible outline-offset" },
  "opacity/scrim": { value: 0.8, source: ".viewer backdrop (bg-black/80)" },
};

/**
 * Fonts (src/lib/fonts.ts) and the weight scale. Both fonts are variable
 * (100 to 900), so a weight is a number, not a style name: Being spells 600
 * "Semi Bold" and Hanken "SemiBold". The scale is all nine of Tailwind's
 * font-* classes (regular is font-normal), so any of them can be used in code
 * and in Figma without changing this file.
 */
const fonts = {
  display: { family: "Being", axis: "100 900" },
  body: { family: "Hanken Grotesk", axis: "100 900" },
  weights: {
    thin: 100,
    extralight: 200,
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
};
const fontsSource = read("src/lib/fonts.ts");
if (
  !fontsSource.includes("Hanken_Grotesk") ||
  !fontsSource.includes("Being-VF")
) {
  throw new Error(
    "src/lib/fonts.ts no longer loads Hanken Grotesk and Being; update fonts in figma-manifest.mjs",
  );
}

const body = {
  ramps: palette.ramps,
  steps: palette.steps,
  roles,
  scale: {
    config: typeScale.config,
    type: typeScale.steps,
    space: typeScale.space,
  },
  motion,
  layout,
  fonts,
};

const hash = createHash("sha256")
  .update(JSON.stringify(body))
  .digest("hex")
  .slice(0, 10);
const manifest = {
  note: "Generated by scripts/figma-manifest.mjs. Do not edit; run `pnpm figma-manifest`.",
  hash,
  ...body,
};

mkdirSync(join(root, "figma"), { recursive: true });
writeFileSync(
  join(root, "figma/manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(
  `figma/manifest.json  hash ${hash}  (${Object.keys(roles).length} roles, ${Object.keys(layout).length} layout tokens)`,
);
