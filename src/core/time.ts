/**
 * Calendar maths in Sri Lanka time. Colombo is UTC+05:30 all year (no
 * daylight saving), so a fixed offset is exact.
 */
export const COLOMBO_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

/** `2026-11-07`: the Colombo calendar date of an instant. */
export function colomboDateKey(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(date.getTime() + COLOMBO_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

/** The instant Colombo midnight starts for that instant's day. */
export function colomboStartOfDay(value: Date): Date {
  const shifted = value.getTime() + COLOMBO_OFFSET_MS;
  return new Date(shifted - (shifted % DAY_MS) - COLOMBO_OFFSET_MS);
}

/** The instant for a Colombo date and wall-clock time. */
export function colomboInstant(
  dateKey: string,
  hour: number,
  minute = 0,
): Date {
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d, hour, minute) - COLOMBO_OFFSET_MS);
}

/** The Colombo date `days` after (or before, if negative) a date key. */
export function addDays(dateKey: string, days: number): string {
  return colomboDateKey(
    new Date(colomboInstant(dateKey, 12).getTime() + days * DAY_MS),
  );
}
