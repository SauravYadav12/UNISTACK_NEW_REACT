/**
 * Client-side mirror of the server's fiscalYearUtil. Same canonical
 * shape: FY start year (e.g. 2024 for "FY 2024–25"). Keeping these in
 * lockstep means filenames, UI labels, and DB documents all speak the
 * same number.
 */

/**
 * Format an FY start year as the canonical label.
 *
 *   getFYLabel(2024) → "2024-25"
 */
export function getFYLabel(start: number): string {
  if (!Number.isFinite(start)) return '';
  const end = (start + 1) % 100;
  return `${start}-${String(end).padStart(2, '0')}`;
}

/**
 * Which FY does the given date fall in? Apr 1 is the boundary.
 */
export function getCurrentFYStart(now: Date = new Date()): number {
  const month = now.getMonth();
  const year = now.getFullYear();
  return month >= 3 ? year : year - 1;
}

/**
 * Parse a flexible FY input — number, 4-digit string, or any of the
 * shorthands we've seen in real Form-16 filenames — to a canonical
 * start year. Returns NaN on unparseable input.
 *
 *   parseFYStart("2024-25")   → 2024
 *   parseFYStart("FY202425")  → 2024
 *   parseFYStart("FY2425")    → 2024
 *   parseFYStart("FY2024")    → 2024
 */
export function parseFYStart(input: string | number): number {
  if (typeof input === 'number') {
    return Number.isFinite(input) ? Math.trunc(input) : NaN;
  }
  if (typeof input !== 'string') return NaN;
  const s = input.trim().toUpperCase().replace(/\s+/g, '');

  const m1 = s.match(/^(?:FY)?(\d{4})[-/](\d{2})$/);
  if (m1) return parseInt(m1[1], 10);
  const m2 = s.match(/^(?:FY)?(\d{4})(\d{2})$/);
  if (m2) return parseInt(m2[1], 10);
  const m3 = s.match(/^(?:FY)?(\d{2})[-/](\d{2})$/);
  if (m3) return 2000 + parseInt(m3[1], 10);
  const m4 = s.match(/^(?:FY)?(\d{2})(\d{2})$/);
  if (m4) return 2000 + parseInt(m4[1], 10);
  const m5 = s.match(/^(?:FY)?(\d{4})$/);
  if (m5) return parseInt(m5[1], 10);

  return NaN;
}
