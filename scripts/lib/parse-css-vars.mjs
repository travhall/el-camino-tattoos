// Shared CSS custom-property parser for scripts/contrast.mjs and
// scripts/figma-manifest.mjs. Both need the same thing: read a stylesheet
// that declares custom properties in a base `:root { ... }` rule plus a
// `@media (prefers-color-scheme: dark) { :root { ... } }` override, and
// return { light: Record<name, rawValue>, dark: Record<name, rawValue> }
// (dark = light merged with the media-query overrides). Uses postcss's real
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

  root.walkRules(":root", (rule) => {
    const inDarkMedia =
      rule.parent?.type === "atrule" &&
      rule.parent.name === "media" &&
      /prefers-color-scheme:\s*dark/.test(rule.parent.params);
    Object.assign(inDarkMedia ? darkOverrides : light, declarationsOf(rule));
  });

  return { light, dark: { ...light, ...darkOverrides } };
}
