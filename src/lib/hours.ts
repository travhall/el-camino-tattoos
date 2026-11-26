/**
 * Opening hours and whether the shop is open right now. Times are 24-hour
 * "HH:MM" strings in the shop's own time zone, whatever zone the visitor is
 * in. A day with no hours is closed. Hours past midnight aren't supported:
 * a day's closing time must be later than its opening time.
 */

export const weekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type Weekday = (typeof weekdays)[number];
export type DayHours = { opens: string; closes: string } | null;
export type WeeklyHours = Record<Weekday, DayHours>;

/** Eau Claire, Wisconsin. */
export const shopTimeZone = "America/Chicago";

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Minutes after midnight, or null if the string isn't "HH:MM". */
export function toMinutes(time: string): number | null {
  const match = timePattern.exec(time.trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** A day's hours if both times are valid and in order, else closed. */
export function dayHours(opens: string, closes: string): DayHours {
  const open = toMinutes(opens);
  const close = toMinutes(closes);
  if (open === null || close === null || close <= open) return null;
  return { opens: opens.trim(), closes: closes.trim() };
}

export const hasHours = (hours: WeeklyHours) =>
  weekdays.some((day) => hours[day] !== null);

/** "20:00" to "8pm", "11:30" to "11:30am", "12:00" to "12pm". */
export function formatTime(time: string): string {
  const minutes = toMinutes(time) ?? 0;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
}

const shortDay: Record<Weekday, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

/** The weekday and minutes after midnight at `date`, in the shop's zone. */
export function shopClock(date: Date, timeZone = shopTimeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    day: get("weekday").toLowerCase() as Weekday,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export type OpenStatus =
  | { state: "open"; closes: string }
  | { state: "later"; opens: string }
  | { state: "closed"; next: { day: string; opens: string } | null };

/**
 * Open now, opening later today, or closed (with the next opening within a
 * week). Null when no hours are set, so callers can fall back to other copy.
 */
export function openStatus(
  hours: WeeklyHours,
  now: Date,
  timeZone = shopTimeZone,
): OpenStatus | null {
  if (!hasHours(hours)) return null;
  const { day, minutes } = shopClock(now, timeZone);
  const today = hours[day];
  if (today) {
    const open = toMinutes(today.opens) ?? 0;
    const close = toMinutes(today.closes) ?? 0;
    if (minutes < open)
      return { state: "later", opens: formatTime(today.opens) };
    if (minutes < close)
      return { state: "open", closes: formatTime(today.closes) };
  }
  const index = weekdays.indexOf(day);
  for (let step = 1; step <= 7; step++) {
    const next = weekdays[(index + step) % 7];
    const h = hours[next];
    if (h) {
      return {
        state: "closed",
        next: {
          day: step === 1 ? "tomorrow" : shortDay[next],
          opens: formatTime(h.opens),
        },
      };
    }
  }
  return { state: "closed", next: null };
}

/**
 * Consecutive days with the same hours grouped into one row, for a table of
 * hours: "Tue–Sat" "12pm–8pm", "Sun–Mon" "Closed".
 */
export function groupHours(hours: WeeklyHours) {
  const label = (h: DayHours) =>
    h ? `${formatTime(h.opens)}–${formatTime(h.closes)}` : "Closed";
  const rows: { days: string; time: string }[] = [];
  let start = 0;
  for (let i = 1; i <= weekdays.length; i++) {
    const same =
      i < weekdays.length &&
      label(hours[weekdays[i]]) === label(hours[weekdays[start]]);
    if (same) continue;
    const first = shortDay[weekdays[start]];
    const last = shortDay[weekdays[i - 1]];
    rows.push({
      days: first === last ? first : `${first}–${last}`,
      time: label(hours[weekdays[start]]),
    });
    start = i;
  }
  return rows;
}
