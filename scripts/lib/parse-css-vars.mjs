// Shared CSS custom-property parser for scripts/contrast.mjs and
// scripts/figma-manifest.mjs. Both need the same thing: read a stylesheet
// that declares custom properties in a base `:root { ... }` rule (the
// default theme) plus a `:root[data-theme="light"] { ... }` override (the
// manual toggle, src/components/theme-toggle.tsx) — and return
// { light: Record<name, rawValue>, dark: Record<name, rawValue> }, where
// dark is the base :root values and light is the base merged with whichever
// light override applies. Uses postcss's real parser instead of hand-rolled
// regex, so nested rules, comments containing `;`, and additional at-rules
// elsewhere in the file cannot silently corrupt the result the way a
// regex/brace-counting approach can.
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
  const dark = {};
  const lightOverrides = {};

  root.walkRules((rule) => {
    if (rule.selector === ":root") {
      Object.assign(dark, declarationsOf(rule));
    } else if (rule.selector === ':root[data-theme="light"]') {
      Object.assign(lightOverrides, declarationsOf(rule));
    }
  });

  return { dark, light: { ...dark, ...lightOverrides } };
}
