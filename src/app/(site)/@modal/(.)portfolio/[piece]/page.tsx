import { notFound } from "next/navigation";
import { PieceLightbox } from "@/components/piece-lightbox";
import { getPiece } from "@/lib/content";

export default async function PieceViewer(props: {
  params: Promise<{ piece: string }>;
}) {
  const { piece: slug } = await props.params;
  if (!(await getPiece(slug))) notFound();
  return <PieceLightbox slug={slug} />;
}
