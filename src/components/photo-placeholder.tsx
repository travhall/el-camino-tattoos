import { FlashStar } from "@/components/flash-star";

/**
 * Stands in for a photo that is missing or failed to load. Fills its parent
 * (the same `relative` media box a `fill` image sits in). With a `label` it is
 * exposed as an image with that name; without one it is decorative.
 */
export function PhotoPlaceholder({ label }: { label?: string }) {
  return (
    <div
      className="photo-placeholder"
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      <FlashStar className="photo-placeholder__star" />
    </div>
  );
}
