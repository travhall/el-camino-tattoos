// Shared CSS custom-property parser for scripts/contrast.mjs and
// scripts/figma-manifest.mjs. Both need the same thing: read a stylesheet
// that declares custom properties in a base `:root { ... }` rule plus dark
// overrides — either `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }`
// (OS preference) or `:root[data-theme="dark"] { ... }` (the manual toggle,
// src/components/theme-toggle.tsx) — and return
// { light: Record<name, rawValue>, dark: Record<name, rawValue> } (dark =
// light merged with whichever dark override applies). Uses postcss's real
// parser instead of hand-rolled regex, so nested rules, comments containing
// `;`, and additional at-rules elsewhere in the file cannot silently corrupt
// the result the way a regex/brace-counting approach can.
import postcss from "postcss";

/** Collects `--name: value;` declarations directly inside a postcss Rule. */
function declarationsOf(rule) {
  const out = {};
  rule.walkDecls(/^--/, (decl) => {
    out[decl.prop.slice(2)] = decl.value.trim();
  });
  return out;
}

/**
 * @param {string} css
 * @returns {{ light: Record<string,string>, dark: Record<string,string> }}
 */
export function parseCssVarRoles(css) {
  const root = postcss.parse(css);
  const light = {};
  const darkOverrides = {};

  // `walkRules(":root", cb)` only matches the exact selector string ":root",
  // so it silently skips ":root:not([data-theme=\"light\"])" and
  // ":root[data-theme=\"dark\"]" — both dark-override selectors actually used
  // in roles.css. Walk every rule and classify by selector instead. A
  // substring test for `[data-theme="light"]` would misfire on the `:not()`
  // form (it contains that exact substring while meaning the opposite), so
  // match the two known dark-override selectors exactly instead; anything
  // else :root-prefixed (the base rule, or a hypothetical explicit light
  // override) is light.
  root.walkRules((rule) => {
    if (!rule.selector.startsWith(":root")) return;

    const inDarkMedia =
      rule.parent?.type === "atrule" &&
      rule.parent.name === "media" &&
      /prefers-color-scheme:\s*dark/.test(rule.parent.params);
    const isOsDark =
      inDarkMedia && rule.selector === ':root:not([data-theme="light"])';
    const isForcedDark = rule.selector === ':root[data-theme="dark"]';

    Object.assign(
      isOsDark || isForcedDark ? darkOverrides : light,
      declarationsOf(rule),
    );
  });

  return { light, dark: { ...light, ...darkOverrides } };
}
