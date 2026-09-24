import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PieceDetail } from "@/components/piece-detail";
import { getArtist, getPiece, getPieces } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const pieces = await getPieces();
  return pieces.map(({ slug }) => ({ piece: slug }));
}

export async function generateMetadata(
  props: PageProps<"/portfolio/[piece]">,
): Promise<Metadata> {
  const { piece: slug } = await props.params;
  const piece = await getPiece(slug);
  if (!piece) return { title: "Portfolio" };
  const artist = await getArtist(piece.artistSlug);
  const details = [piece.style, piece.placement].filter(Boolean).join(", ");
  return pageMetadata({
    title: piece.title,
    description: `${piece.title}${artist ? ` by ${artist.name}` : ""}.${details ? ` ${details}.` : ""}`,
    path: `/portfolio/${piece.slug}`,
    image: piece.image,
    imageAlt: artist ? `${piece.title} by ${artist.name}` : piece.title,
  });
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
