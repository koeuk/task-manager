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
