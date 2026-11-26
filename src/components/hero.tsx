import { Photo } from "@/components/photo";
import { ButtonLink } from "@/components/ui/button";
import type { HeroContent } from "@/lib/content";

/**
 * The block at the top of a page: eyebrow, the page's h1, an intro with up
 * to two buttons, and an optional photo beside it (design: Figma, Ideation
 * page, "Hero - Home" and "Hero - Page + Left/Right Image"). Content comes
 * from Keystatic's "Page heroes" entry via getHero(); styles are .hero in
 * components.css.
 *
 * size "home" sets the heading at the display size and the intro as a lead;
 * "page" uses the h1 size and body text. The photo sits under the text on
 * phones and beside it from lg, on the side the editor picked.
 *
 * The photo takes the scroll-conceal effect (components.css): it stays put
 * on screen while its frame scrolls away, so the frame's lower edge rises
 * over it. On phones it comes first, so the text scrolls up under it.
 */
export function Hero({
  hero,
  fallbackHeading,
  size = "page",
  headingAs: Heading = "h1",
  pinned = true,
}: {
  hero: HeroContent;
  /** The h1 when the editor left the heading empty (the page's name). */
  fallbackHeading: string;
  size?: "home" | "page";
  /** "p" for demos on a page that already has its h1 (the styleguide). */
  headingAs?: "h1" | "p";
  /**
   * The scroll-conceal effect. It assumes the hero is at the top of the
   * page, so turn it off anywhere else (the styleguide's demos).
   */
  pinned?: boolean;
}) {
  const heading = hero.heading || fallbackHeading;
  const { image } = hero;
  const classes = [
    "hero",
    size === "home" && "hero--home",
    image && `hero--image-${image.position}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <div className="hero__content">
        {hero.eyebrow && <p className="eyebrow">{hero.eyebrow}</p>}
        <Heading className="hero__heading">
          {heading.split("\n").map((line, index) => (
            <span key={index} className="hero__heading-line">
              {line}
            </span>
          ))}
        </Heading>
        {(hero.intro || hero.buttons.length > 0) && (
          <div className="hero__body">
            {hero.intro && <p className="hero__intro">{hero.intro}</p>}
            {hero.buttons.length > 0 && (
              <div className="hero__actions">
                {hero.buttons.map((button, index) => (
                  <ButtonLink
                    key={button.href + button.label}
                    href={button.href}
                    variant={index === 0 ? "primary" : "secondary"}
                    icon={index === 0 ? "arrow-up-right" : undefined}
                  >
                    {button.label}
                  </ButtonLink>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {image && (
        <div className={pinned ? "hero__media scroll-conceal" : "hero__media"}>
          <div className="scroll-conceal__content">
            <Photo
              src={image.src}
              alt={image.alt}
              fill
              priority
              sizes="(min-width: 1024px) 420px, 100vw"
              className="image-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
}
