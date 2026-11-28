import Link from "next/link";
import { Photo } from "@/components/photo";
import type { Piece } from "@/lib/content";

/**
 * The artist's featured work, in their profile beside the portrait: up to
 * three pieces, landscape, numbered and captioned like a flash sheet, so it
 * reads as a pick rather than the start of the portrait grid below. Which pieces show
 * is the Featured tick on each piece (getFeaturedPieces).
 */
export function FeaturedWork({
  pieces,
  artistName,
}: {
  pieces: readonly Piece[];
  artistName: string;
}) {
  if (pieces.length === 0) return null;
  return (
    // Named for assistive tech only: the numbered, captioned frames say
    // what they are without a visible heading.
    <section aria-label="Featured work" className="featured-work">
      <ol className="featured-work__list">
        {pieces.map((piece, index) => {
          const meta = [piece.style, piece.placement]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={piece.slug} className="featured-work__item">
              {/* Opens in the piece viewer, like the grid (scroll={false}
                  keeps the page from jumping; see PieceGrid). */}
              <Link
                href={`/portfolio/${piece.slug}`}
                scroll={false}
                className="featured-work__link"
              >
                <div className="featured-work__media">
                  <Photo
                    src={piece.image}
                    alt={`${piece.title} by ${artistName}`}
                    fill
                    sizes="(min-width: 768px) 20vw, 70vw"
                    className="image-cover featured-work__image"
                  />
                </div>
                <p className="featured-work__caption">
                  <span className="featured-work__number" aria-hidden="true">
                    No. {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="featured-work__title">{piece.title}</span>
                  {meta && <span className="featured-work__meta">{meta}</span>}
                </p>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
