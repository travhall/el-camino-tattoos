import { Photo } from "@/components/photo";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import type { Piece } from "@/lib/content";

export function HeroPhoto({
  piece,
  artistName,
  walkIns,
  caption,
}: {
  /** The photo to show; with none, the frame holds a placeholder. */
  piece: Piece | null;
  artistName: string | undefined;
  walkIns: boolean;
  caption?: string;
}) {
  return (
    <div className="home-hero__photo">
      <div className="photo-frame">
        <div className="photo-frame__media">
          {piece ? (
            <Photo
              src={piece.image}
              alt={artistName ? `${piece.title} by ${artistName}` : piece.title}
              fill
              sizes="(min-width: 768px) 46vw, 90vw"
              className="image-cover"
              priority
            />
          ) : (
            <PhotoPlaceholder />
          )}
        </div>
        {caption && <p className="photo-frame__caption">{caption}</p>}
        {walkIns ? (
          <div aria-hidden="true" className="stamp">
            <span className="stamp__title">Walk-ins</span>
            <span className="stamp__line">Welcome</span>
            <span className="stamp__small">When available</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
