/**
 * Display formatting shared with the apps (pctw-collector Formatters):
 * money stays integer cents until it becomes text, and times are
 * Asia/Colombo, 24-hour.
 */

export const TIME_ZONE = "Asia/Colombo";

const CURRENCY = "Rs.";
/** U+2212, the minus sign the designs use. */
const MINUS = "−";
/** U+2013, between the two ends of a time window. */
const EN_DASH = "–";

const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** `1,234.00` without the currency. With `decimals: false`, whole amounts drop `.00`. */
export function formatAmount(
  cents: number,
  { decimals = true }: { decimals?: boolean } = {},
): string {
  assertCents(cents);
  const abs = Math.abs(cents);
  const rupees = grouped.format(Math.trunc(abs / 100));
  const remainder = abs % 100;
  if (!decimals && remainder === 0) return rupees;
  return `${rupees}.${String(remainder).padStart(2, "0")}`;
}

/** `Rs. 1,234.00`, or `− Rs. 500.00` for a negative amount. */
export function formatMoney(
  cents: number,
  options?: { decimals?: boolean },
): string {
  const sign = cents < 0 ? `${MINUS} ` : "";
  return `${sign}${CURRENCY} ${formatAmount(cents, options)}`;
}

/** `+ Rs. 1,140.00` or `− Rs. 500.00`, for ledgers. */
export function formatSignedMoney(
  cents: number,
  options?: { decimals?: boolean },
): string {
  const sign = cents < 0 ? MINUS : "+";
  return `${sign} ${CURRENCY} ${formatAmount(cents, options)}`;
}

/** Rupees typed into a form, such as `"1,234.5"`, to cents. Null if it isn't a valid amount. */
export function rupeesToCents(input: string): number | null {
  const cleaned = input.replace(/[,\s]/g, "").replace(/^Rs\.?/i, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

/** Cents to the plain rupee string a form field shows, such as `1234.50`. */
export function centsToRupeesInput(cents: number): string {
  assertCents(cents);
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** `7.40 kg`. */
export function formatWeight(kg: number, fractionDigits = 2): string {
  return `${kg.toFixed(fractionDigits)} kg`;
}

/** `1.2 km`. */
export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}

/** `1,284`. */
export function formatCount(value: number): string {
  return grouped.format(value);
}

/** `+94 77 123 4567` from E.164. Anything else is returned as given. */
export function formatLkMobile(e164: string): string {
  const match = /^\+94(\d{2})(\d{3})(\d{4})$/.exec(e164);
  if (!match) return e164;
  return `+94 ${match[1]} ${match[2]} ${match[3]}`;
}

/** `NP` from "Nadeesha Perera": the avatar tile's letters. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
});

const fullDateFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const toDate = (value: Date | string) =>
  typeof value === "string" ? new Date(value) : value;

/** `09:15`. */
export function formatTime(value: Date | string): string {
  return timeFormat.format(toDate(value));
}

/** `10:00–11:00`. */
export function formatTimeWindow(
  start: Date | string,
  end: Date | string,
): string {
  return `${formatTime(start)}${EN_DASH}${formatTime(end)}`;
}

/** `Tue 3 Nov`. */
export function formatWeekdayDate(value: Date | string): string {
  return dateFormat.format(toDate(value)).replace(",", "");
}

/** `Tue 3 Nov` for a calendar date such as `2026-11-03`, with no time-zone shift. */
export function formatDateKey(dateKey: string): string {
  // Noon UTC is the same calendar day in Colombo.
  return formatWeekdayDate(`${dateKey}T06:30:00Z`);
}

/** `3 Nov 2026`. */
export function formatDate(value: Date | string): string {
  return fullDateFormat.format(toDate(value));
}

/** `Tue 3 Nov, 09:15`. */
export function formatDateTime(value: Date | string): string {
  return `${formatWeekdayDate(value)}, ${formatTime(value)}`;
}

/** `just now`, `5 min ago`, `2 h ago`, then the date. */
export function formatRelative(
  value: Date | string,
  now: Date = new Date(),
): string {
  const seconds = Math.round((now.getTime() - toDate(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return formatWeekdayDate(value);
}

function assertCents(cents: number): void {
  if (!Number.isInteger(cents)) {
    throw new RangeError(`Money must be integer cents, got ${cents}.`);
  }
}
