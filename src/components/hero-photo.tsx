import Image from "next/image";
import type { Piece } from "@/lib/content";

export function HeroPhoto({
  piece,
  artistName,
  walkIns,
}: {
  piece: Piece | null;
  artistName: string | undefined;
  walkIns: boolean;
}) {
  if (!piece) return null;

  return (
    <div className="home-hero__photo">
      <div className="photo-frame">
        <div className="photo-frame__media">
          <Image
            src={piece.image}
            alt={artistName ? `${piece.title} by ${artistName}` : piece.title}
            fill
            sizes="(min-width: 768px) 40vw, 90vw"
            className="image-cover"
            priority
          />
        </div>
        <span aria-hidden="true" className="photo-frame__tape" />
      </div>
      {walkIns ? (
        <div aria-hidden="true" className="stamp">
          <span className="stamp__line">Walk-ins</span>
          <span className="stamp__line">Welcome</span>
        </div>
      ) : null}
    </div>
  );
}
