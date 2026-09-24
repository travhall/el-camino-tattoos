import type { Site } from "@/lib/content";

/** Walk-in and consultation lines from the shop info. Renders nothing if neither is set. */
export function ShopNotes({ site }: { site: Site }) {
  const notes = [
    site.walkIns ? site.walkInNote || "Walk-ins welcome." : "",
    site.consultationNote,
  ].filter(Boolean);
  if (notes.length === 0) return null;

  return <p className="lead measure">{notes.join(" ")}</p>;
}
