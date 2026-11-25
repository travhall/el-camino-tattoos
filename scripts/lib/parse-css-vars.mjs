// Shared CSS custom-property parser for scripts/contrast.mjs and
// scripts/figma-manifest.mjs. Both need the same thing: read roles.css, which
// declares the one (dark) theme's custom properties in a `:root { ... }` rule,
// and return them as Record<name, rawValue>. Uses postcss's real parser
// instead of hand-rolled regex, so nested rules, comments containing `;`, and
// additional at-rules elsewhere in the file cannot silently corrupt the result.
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
 * @returns {Record<string,string>} every custom property declared on `:root`
 */
export function parseCssVarRoles(css) {
  const root = postcss.parse(css);
  const roles = {};
  root.walkRules((rule) => {
    if (rule.selector === ":root") Object.assign(roles, declarationsOf(rule));
  });
  return roles;
}
