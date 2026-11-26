import { notFound } from "next/navigation";
import { PieceLightbox } from "@/components/piece-lightbox";
import { getArtist, getPiece } from "@/lib/content";

export default async function PieceViewer(props: {
  params: Promise<{ piece: string }>;
}) {
  const { piece: slug } = await props.params;
  const piece = await getPiece(slug);
  if (!piece) notFound();
  const artist = await getArtist(piece.artistSlug);

  return <PieceLightbox piece={piece} artist={artist} />;
}
