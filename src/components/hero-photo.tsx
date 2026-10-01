import Image from "next/image";
import { FlashStar } from "@/components/flash-star";
import type { Piece } from "@/lib/content";

export function HeroPhoto({
  piece,
  artistName,
  walkIns,
  caption,
}: {
  piece: Piece | null;
  artistName: string | undefined;
  walkIns: boolean;
  caption?: string;
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
            sizes="(min-width: 768px) 46vw, 90vw"
            className="image-cover"
            priority
          />
        </div>
        {caption && (
          <p className="photo-frame__caption">
            <span>{caption}</span>
            <FlashStar className="photo-frame__star" />
          </p>
        )}
        <span aria-hidden="true" className="photo-frame__tape" />
      </div>
      {walkIns ? (
        <div aria-hidden="true" className="stamp">
          <span className="stamp__line">Walk-ins</span>
          <span className="stamp__line">Welcome</span>
          <FlashStar className="stamp__star" />
          <span className="stamp__small">When available</span>
        </div>
      ) : null}
    </div>
  );
}
