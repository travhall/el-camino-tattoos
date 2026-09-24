import Markdoc, { type Node } from "@markdoc/markdoc";
import React from "react";

/**
 * Renders rich text an editor wrote in Keystatic (Markdoc): paragraphs,
 * bold, italic, links, lists and, on Aftercare, h2 and h3. The editor only
 * offers those, and the styles live in `.richtext` (typography.css).
 */
export function RichText({ node }: { node: Node }) {
  const tree = Markdoc.transform(node);
  return (
    <div className="richtext measure">
      {Markdoc.renderers.react(tree, React)}
    </div>
  );
}
