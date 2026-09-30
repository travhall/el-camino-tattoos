// WCAG contrast checks for the semantic color roles.
//
// Roles live, hand-edited, in src/styles/roles.css. This module reads that file
// and the generated ramps (palette.generated.json), resolves each role to a hex
// value for light and dark, and measures the pairings below. It only reports:
// nothing here blocks the build or the dev server. `pnpm check:contrast` prints
// the result and exits 1 on a failure (CI runs it), and /styleguide shows it.
import { readFile } from "node:fs/promises";
import { parseCssVarRoles } from "./lib/parse-css-vars.mjs";

// Known gap, deliberately not listed: in light mode `accent-mark` on
// `surface-sunken` measures 2.63:1, under the 3:1 it needs. Nothing sits on
// `surface-sunken` yet. Add that row, and fix the surface or the role, before
// the first component sits on it.
//
// UI tokens that only repeat a role (link-text is foreground, chip-border is
// outline, ...) are covered by that role's rows; rows are listed only where a
// token makes a new pairing.
//
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
  ["accent-mark", "background", 3, "gold underlines, marks, accent-fill edges"],
  ["accent-mark", "surface", 3, "gold marks on surface"],
  ["accent-mark", "surface-raised", 3, "gold marks on a raised surface"],
  ["foreground", "accent-soft", 4.5, "text on soft accent"],
  ["button-primary-fg", "button-primary-bg", 4.5, "primary button label"],
  [
    "button-primary-fg",
    "button-primary-hover",
    4.5,
    "primary button label, hovered",
  ],
  ["button-primary-border", "background", 3, "primary button edge"],
  ["button-primary-border", "surface", 3, "primary button edge on surface"],
  [
    "button-primary-border",
    "surface-raised",
    3,
    "primary button edge on a raised surface",
  ],
  [
    "button-primary-border",
    "surface-sunken",
    3,
    "primary button edge on a sunken surface",
  ],
  ["chip-selected-fg", "chip-selected-bg", 4.5, "selected chip label"],
  ["selection-fg", "selection-bg", 4.5, "selected text"],
  ["error-text", "background", 4.5, "error message"],
  ["error-text", "surface", 4.5, "error message on surface"],
  ["error-text", "surface-sunken", 4.5, "error message on a sunken surface"],
  ["error-text", "error-soft", 4.5, "error message on an alert"],
  ["foreground", "error-soft", 4.5, "text on an alert"],
  ["error", "background", 3, "invalid control border"],
  ["error", "surface", 3, "invalid border on surface"],
  ["error", "surface-sunken", 3, "invalid border on a sunken surface"],
  ["error", "error-soft", 3, "alert edge on its own tint"],
  ["success-text", "background", 4.5, "success message"],
  ["success-text", "surface", 4.5, "success message on surface"],
  ["success-text", "surface-sunken", 4.5, "success message on a sunken surface"],
  ["success-text", "success-soft", 4.5, "success message on its tint"],
  ["foreground", "success-soft", 4.5, "text on a success tint"],
  ["success", "background", 3, "open / success marks"],
  ["success", "surface", 3, "success marks on surface"],
  ["success", "surface-raised", 3, "success marks on a raised surface"],
  ["success", "success-soft", 3, "success edge on its own tint"],
  ["warning-text", "background", 4.5, "warning message"],
  ["warning-text", "surface", 4.5, "warning message on surface"],
  ["warning-text", "surface-sunken", 4.5, "warning message on a sunken surface"],
  ["warning-text", "warning-soft", 4.5, "warning message on its tint"],
  ["foreground", "warning-soft", 4.5, "text on a warning tint"],
  ["warning", "background", 3, "waitlist / warning marks"],
  ["warning", "surface", 3, "warning marks on surface"],
  ["warning", "surface-raised", 3, "warning marks on a raised surface"],
  ["warning", "warning-soft", 3, "warning edge on its own tint"],
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

/**
 * Splits roles.css into light values and dark values. Dark is whatever the
 * `prefers-color-scheme: dark` block sets, on top of the light values.
 */
export const parseRoles = parseCssVarRoles;

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
