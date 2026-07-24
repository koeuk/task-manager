/**
 * Parse an API date field as a LOCAL calendar day.
 *
 * Due/start dates are calendar days, but the API serialises them as UTC midnight
 * (e.g. '2026-07-20T00:00:00.000000Z'). `new Date(...)` converts that to the
 * viewer's timezone, which rolls the day backwards for anyone west of UTC
 * (UTC-5 would read '2026-07-19'). Taking the date portion keeps the intended
 * day in every timezone.
 *
 * Returns local midnight on that day, or null when there is nothing to parse.
 */
export function parseApiDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/** Local midnight today — the reference point for every "is it overdue / how
 * many days away" comparison, so those all agree on where a day starts. */
export function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Whole calendar days from today to `value`: 0 today, 1 tomorrow, -1 yesterday.
 * Returns null when there is no parseable date.
 *
 * Both sides are normalised to local midnight first, so the result counts
 * calendar days rather than 24-hour spans (which would be off by one either
 * side of a daylight-saving change).
 */
export function daysFromToday(value: string | Date | null | undefined): number | null {
  const date = parseApiDate(value);
  if (!date) return null;

  const due = new Date(date);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - startOfToday().getTime()) / 86_400_000);
}

/** True when `value` is a calendar day strictly before today. */
export function isPastDay(value: string | Date | null | undefined): boolean {
  const days = daysFromToday(value);
  return days !== null && days < 0;
}

/** Convert a Date (or date-like value) to a 'YYYY-MM-DD' string using local
 * calendar parts, avoiding the UTC shift that toISOString() introduces. */
export function toDateString(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
