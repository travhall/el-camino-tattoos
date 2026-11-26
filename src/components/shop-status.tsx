"use client";

import { useSyncExternalStore } from "react";
import { type WeeklyHours, openStatus } from "@/lib/hours";

// The current minute, so the status re-renders as the shop opens and closes.
// Pages are prerendered, so "now" can only be known in the browser: the
// server snapshot is null and the server HTML shows the walk-in note.
const minute = () => Math.floor(Date.now() / 60_000);
function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 15_000);
  return () => clearInterval(id);
}

/**
 * Open now, opening later, or closed, from the shop's hours in its own time
 * zone. With no hours set it shows the walk-in note instead (as it does
 * before scripts run). The dot is decorative; the words carry the state.
 */
export function ShopStatus({
  hours,
  walkIns,
  walkInNote,
  className,
}: {
  hours: WeeklyHours;
  walkIns: boolean;
  walkInNote: string;
  className?: string;
}) {
  const now = useSyncExternalStore(subscribe, minute, () => null);
  const status =
    now === null ? null : openStatus(hours, new Date(now * 60_000));

  if (!status) {
    if (!walkInNote) return null;
    return (
      <span className={className} data-state="open">
        <span aria-hidden="true" className="status-dot" />
        <span className="shop-status__detail">{walkInNote}</span>
      </span>
    );
  }

  const [label, detail] =
    status.state === "open"
      ? [
          "Open today",
          walkIns ? "Walk-ins available" : `Until ${status.closes}`,
        ]
      : status.state === "later"
        ? [`Opens at ${status.opens} today`, ""]
        : [
            "Closed now",
            status.next
              ? `Opens ${status.next.day} at ${status.next.opens}`
              : "",
          ];

  return (
    <span className={className} data-state={status.state}>
      <span aria-hidden="true" className="status-dot" />
      <span className="shop-status__label">{label}</span>
      {detail && <span className="shop-status__detail">{detail}</span>}
    </span>
  );
}
