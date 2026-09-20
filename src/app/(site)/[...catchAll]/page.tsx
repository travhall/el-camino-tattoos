import { notFound } from "next/navigation";

// Catches every URL that matches no other route, so a 404 renders inside the
// site layout (lang, fonts, header, footer, stable title) instead of Next's
// bare fallback document.
export default function CatchAllPage(): never {
  notFound();
}
