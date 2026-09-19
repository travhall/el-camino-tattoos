import { notFound } from "next/navigation";
import { PieceDetail } from "@/components/piece-detail";
import { PieceViewerDialog } from "@/components/piece-viewer-dialog";
import { getArtist, getPiece } from "@/lib/content";

export default async function PieceViewer(props: {
  params: Promise<{ piece: string }>;
}) {
  const { piece: slug } = await props.params;
  const piece = await getPiece(slug);
  if (!piece) notFound();
  const artist = await getArtist(piece.artistSlug);

  return (
    <PieceViewerDialog>
      <PieceDetail piece={piece} artist={artist} />
    </PieceViewerDialog>
  );
}
