import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PieceDetail } from "@/components/piece-detail";
import { getArtist, getPiece, getPieces } from "@/lib/content";

export async function generateStaticParams() {
  const pieces = await getPieces();
  return pieces.map(({ slug }) => ({ piece: slug }));
}

export async function generateMetadata(
  props: PageProps<"/portfolio/[piece]">,
): Promise<Metadata> {
  const { piece: slug } = await props.params;
  const piece = await getPiece(slug);
  return { title: piece?.title ?? "Portfolio" };
}

export default async function PiecePage(
  props: PageProps<"/portfolio/[piece]">,
) {
  const { piece: slug } = await props.params;
  const piece = await getPiece(slug);
  if (!piece) notFound();
  const artist = await getArtist(piece.artistSlug);

  return <PieceDetail piece={piece} artist={artist} />;
}
