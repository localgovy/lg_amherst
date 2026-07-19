/**
 * Date Utilities
 *
 * Shared helpers for parsing date strings coming from Supabase.
 * Source data may arrive as a plain date (`YYYY-MM-DD`) or as a full
 * ISO timestamp (`YYYY-MM-DDTHH:mm:ssZ`) — this strips any time portion
 * before parsing so we always get a valid local-time Date, avoiding the
 * "NaN" bugs that occur when `new Date(NaN, NaN, NaN)` is constructed
 * from an un-split ISO string.
 */

/**
 * Parses a `YYYY-MM-DD` or ISO date string into a local-time Date at midnight.
 * Returns `null` if the string is missing or not a recognizable date.
 */
export function parseLocalDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;

  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);

  if (!year || !month || !day || Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }

  return new Date(year, month - 1, day);
}

/** Returns true if the given date string is today or in the future (local time). */
export function isUpcoming(dateString: string | null | undefined): boolean {
  const date = parseLocalDate(dateString);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}
