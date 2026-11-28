import type { Artist, BookingStatus as Status } from "@/lib/content";

const labels: Record<Status, string> = {
  open: "Books open",
  waitlist: "Waitlist",
  closed: "Books closed",
};

/**
 * An artist's booking status, when they chose to show one (Work → Artists →
 * Booking status). The dot's color repeats the words, so it is never color
 * alone. `compact` drops the note (the artist cards).
 */
export function BookingStatus({
  booking,
  compact = false,
}: {
  booking: NonNullable<Artist["booking"]>;
  compact?: boolean;
}) {
  return (
    <p className="booking-status" data-status={booking.status}>
      <span className="status-dot" aria-hidden="true" />
      <span className="booking-status__label">{labels[booking.status]}</span>
      {!compact && booking.note && (
        <span className="booking-status__note">{booking.note}</span>
      )}
    </p>
  );
}
