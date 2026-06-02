/**
 * Convert a positive integer to its Indian-English word form,
 * using the lakh / crore numbering convention (Indian comma style).
 *
 * Examples:
 *   1,200,000  → "Twelve Lakh"
 *   2,50,000   → "Two Lakh Fifty Thousand"
 *   1,00,000   → "One Lakh"
 *   75,00,000  → "Seventy Five Lakh"
 *   1,23,45,678 → "One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight"
 *
 * Caller decides whether to append "Rupees Only" — `numberToIndianWords()`
 * returns just the numeric phrase. The convenience wrapper
 * `salaryInWords()` does append the currency suffix for direct use in
 * salary input helper-text and offer-letter renderers.
 *
 * Non-integers are rounded to the nearest rupee (paise rendering would
 * add complexity we don't need for annual-salary use cases — every
 * surface that calls this passes whole rupees).
 *
 * Supports up to 99 Crore (~9.9 billion rupees); above that we degrade
 * gracefully by falling back to the numeric digit string.
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
  'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

// 0-99 → words
function twoDigit(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const r = n % 10;
  return TENS[t] + (r ? ' ' + ONES[r] : '');
}

// 0-999 → words
function threeDigit(n: number): string {
  if (n < 100) return twoDigit(n);
  const h = Math.floor(n / 100);
  const r = n % 100;
  return ONES[h] + ' Hundred' + (r ? ' ' + twoDigit(r) : '');
}

export function numberToIndianWords(input: number | string | null | undefined): string {
  // Defensive parsing — accept strings the way input fields hand them
  // over (with stray commas, decimals, signs).
  if (input === null || input === undefined || input === '') return '';
  const raw = typeof input === 'string'
    ? input.replace(/[,\s₹]/g, '')
    : String(input);
  const num = Number(raw);
  if (!Number.isFinite(num)) return '';
  if (num === 0) return 'Zero';

  const negative = num < 0;
  let n = Math.round(Math.abs(num));

  // Above 99 Cr → degrade to digits (very rare for salary).
  if (n >= 99 * 10000000 + 99 * 100000 + 99 * 1000 + 999) {
    // Generous upper bound — anything above this returns a digit
    // string so we don't render nonsense like "One Hundred Crore"
    // without a "Hundred"-handling Crore branch.
    return new Intl.NumberFormat('en-IN').format(num);
  }

  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = n;

  if (crore) parts.push(twoDigit(crore) + ' Crore');
  if (lakh) parts.push(twoDigit(lakh) + ' Lakh');
  if (thousand) parts.push(twoDigit(thousand) + ' Thousand');
  if (hundred) parts.push(threeDigit(hundred));

  const phrase = parts.join(' ');
  return (negative ? 'Minus ' : '') + phrase;
}

/**
 * Salary-tailored wrapper that appends "Rupees Only" — the canonical
 * suffix for Indian payslips, offer letters, and form helper-text.
 * Returns empty string for empty / zero / invalid input so callers can
 * short-circuit rendering with a simple truthy check.
 */
export function salaryInWords(
  input: number | string | null | undefined,
): string {
  const phrase = numberToIndianWords(input);
  if (!phrase) return '';
  if (phrase === 'Zero') return '';
  return `${phrase} Rupees Only`;
}
