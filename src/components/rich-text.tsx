import Markdoc, { type Node, type RenderableTreeNode } from "@markdoc/markdoc";
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

function collectText(node: RenderableTreeNode): string {
  if (typeof node === "string") return node;
  if (node instanceof Markdoc.Tag)
    return node.children.map(collectText).join(" ");
  return "";
}

/** Flattens a Markdoc rich-text node to plain text (for JSON-LD, meta descriptions, etc). */
export function richTextToPlainText(node: Node): string {
  return collectText(Markdoc.transform(node)).replace(/\s+/g, " ").trim();
}
