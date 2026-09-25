// WCAG contrast checks for the semantic color roles.
//
// Roles live, hand-edited, in src/styles/roles.css. This module reads that file
// and the generated ramps (palette.generated.json), resolves each role to a hex
// value for light and dark, and measures the pairings below. It only reports:
// nothing here blocks the build or the dev server. `pnpm check:contrast` prints
// the result and exits 1 on a failure (CI runs it), and /styleguide shows it.
import { readFile } from "node:fs/promises";

// [foreground role, background role, minimum WCAG ratio, what it covers]
export const PAIRS = [
  ["foreground", "background", 7, "body text"],
  ["foreground", "surface", 7, "text on surface"],
  ["foreground", "surface-raised", 7, "text on a raised surface"],
  ["foreground", "surface-sunken", 7, "text on a sunken surface"],
  ["foreground", "scrim", 7, "text on a scrim"],
  ["foreground", "hover", 4.5, "text on hover fill"],
  ["background", "foreground", 4.5, "label on an ink (inverse) fill"],
  ["muted", "background", 4.5, "secondary text"],
  ["muted", "surface", 4.5, "secondary text on surface"],
  ["muted", "surface-raised", 4.5, "secondary text on a raised surface"],
  ["muted", "surface-sunken", 4.5, "secondary text on a sunken surface"],
  ["muted", "scrim", 4.5, "secondary text on a scrim"],
  ["subtle", "background", 4.5, "third-tier text"],
  ["subtle", "surface", 4.5, "third-tier text on surface"],
  ["subtle", "surface-raised", 4.5, "third-tier text on a raised surface"],
  ["subtle", "surface-sunken", 4.5, "third-tier text on a sunken surface"],
  ["subtle", "scrim", 4.5, "third-tier text on a scrim"],
  ["outline", "background", 3, "input and chip borders"],
  ["outline", "surface", 3, "borders on surface"],
  ["outline", "surface-raised", 3, "borders on a raised surface"],
  ["outline", "surface-sunken", 3, "borders on a sunken surface"],
  ["accent-text", "background", 4.5, "accent text and links"],
  ["accent-text", "surface", 4.5, "accent text on surface"],
  ["accent-text", "surface-sunken", 4.5, "accent text on a sunken surface"],
  ["focus", "background", 3, "focus ring"],
  ["focus", "surface", 3, "focus ring on surface"],
  ["focus", "surface-raised", 3, "focus ring on a raised surface"],
  ["focus", "surface-sunken", 3, "focus ring on a sunken surface"],
  ["accent-foreground", "accent", 4.5, "text on accent fill"],
  ["accent-foreground", "accent-hover", 4.5, "text on accent fill, hovered"],
  ["accent-edge", "background", 3, "border around an accent fill"],
  ["accent-edge", "surface", 3, "accent fill border on surface"],
  ["foreground", "accent-soft", 4.5, "text on soft accent"],
  ["highlight-text", "background", 4.5, "red as text"],
  ["highlight-text", "surface", 4.5, "red as text on surface"],
  ["highlight", "background", 3, "red underlines and state marks"],
  ["highlight", "surface", 3, "red state marks on surface"],
  ["highlight-foreground", "highlight", 4.5, "text on red fill"],
  ["error-text", "background", 4.5, "error message"],
  ["error-text", "surface", 4.5, "error message on surface"],
  ["error-text", "error-soft", 4.5, "error message on an alert"],
  ["foreground", "error-soft", 4.5, "text on an alert"],
  ["error", "background", 3, "invalid control border"],
  ["error", "surface", 3, "invalid border on surface"],
  ["error", "error-soft", 3, "alert edge on its own tint"],
];

const toLinear = (c) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

function luminance(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    toLinear(v / 255),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const declarations = (text) =>
  Object.fromEntries(
    [...text.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [
      m[1],
      m[2].trim(),
    ]),
  );

/**
 * Splits roles.css into light values and dark values. Dark is whatever the
 * `prefers-color-scheme: dark` block sets, on top of the light values.
 */
export function parseRoles(css) {
  const media = /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{/.exec(css);
  let light = css;
  let dark = "";
  if (media) {
    const start = media.index + media[0].length;
    let depth = 1;
    let end = start;
    while (end < css.length && depth > 0) {
      if (css[end] === "{") depth++;
      if (css[end] === "}") depth--;
      end++;
    }
    dark = css.slice(start, end - 1);
    light = css.slice(0, media.index) + css.slice(end);
  }
  const lightVars = declarations(light);
  return { light: lightVars, dark: { ...lightVars, ...declarations(dark) } };
}

/** Resolves `var(--paper-50)`, `var(--other-role)` or a #hex to a #rrggbb. */
function resolve(name, vars, ramps, depth = 0) {
  const value = vars[name];
  if (!value || depth > 5) return undefined;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value);
  if (hex) {
    const h = hex[1];
    return `#${h.length === 3 ? [...h].map((c) => c + c).join("") : h}`;
  }
  const ref = /^var\(--([a-z0-9-]+)\)$/.exec(value);
  if (!ref) return undefined;
  const step = /^([a-z]+)-(\d+)$/.exec(ref[1]);
  if (step && ramps[step[1]]?.[step[2]]) return ramps[step[1]][step[2]];
  return resolve(ref[1], vars, ramps, depth + 1);
}

/** One row per pairing: ratios for light and dark, or null if a role is missing. */
export function checkContrast(rolesCss, ramps) {
  const modes = parseRoles(rolesCss);
  return PAIRS.map(([fg, bg, min, note]) => {
    const row = { fg, bg, min, note, light: null, dark: null };
    for (const mode of ["light", "dark"]) {
      const a = resolve(fg, modes[mode], ramps);
      const b = resolve(bg, modes[mode], ramps);
      if (a && b) row[mode] = Math.round(contrast(a, b) * 100) / 100;
    }
    return row;
  });
}

export const passes = (row, mode) => row[mode] !== null && row[mode] >= row.min;

export async function loadInputs(root = process.cwd()) {
  const [rolesCss, palette] = await Promise.all([
    readFile(`${root}/src/styles/roles.css`, "utf8"),
    readFile(`${root}/src/styles/palette.generated.json`, "utf8"),
  ]);
  return { rolesCss, ramps: JSON.parse(palette).ramps };
}
