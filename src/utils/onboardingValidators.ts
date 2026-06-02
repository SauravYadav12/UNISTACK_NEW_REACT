/**
 * Shared input validators for the onboarding flows.
 *
 * Used by:
 *   - AddCandidateDialog        — HR seeds a candidate.
 *   - OnboardingFormPage        — candidate fills personal info + 2 references.
 *   - OfferLetterComposeDialog  — HR tweaks offer variables before sending.
 *
 * Keeping them in one place ensures the candidate-side and HR-side
 * surfaces apply identical rules (e.g. so the candidate can never
 * submit a 9-digit phone that HR's own dialog wouldn't have allowed).
 */

// Permissive RFC-5322-ish email regex. Not bulletproof — no email
// regex is — but rejects the common typo cases (missing @, missing
// domain, embedded whitespace) and is friendly to international
// domains.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Plain 10-digit phone (Indian format). The input layer strips
// non-digits before this is checked, so callers never have to think
// about formatting whitespace / dashes / `+` prefixes.
export const PHONE_RE = /^\d{10}$/;

export function isValidEmail(s: string | undefined | null): boolean {
  if (!s) return false;
  return EMAIL_RE.test(s.trim());
}

export function isValidPhone(s: string | undefined | null): boolean {
  if (!s) return false;
  return PHONE_RE.test(String(s).replace(/\D/g, ''));
}

/**
 * Strip non-digits and cap at `maxLen`. Used as an `onChange` filter
 * on phone TextFields so a stray paste of "+91 (812) 312-9923" or
 * letter typos can't make it into form state. Default maxLen = 10
 * matches the 10-digit phone rule.
 */
export function digitsOnly(s: string, maxLen = 10): string {
  return (s || '').replace(/\D/g, '').slice(0, maxLen);
}

/**
 * Number-field display helper. Returns `''` when the underlying value
 * is 0 / undefined so the input renders empty instead of "0".
 * Combined with `Number(e.target.value) || 0` on the onChange, the
 * field behaves naturally on edit: user clears the field and types
 * fresh without fighting a stuck leading zero.
 */
export function displayNumber(n: number | undefined | null): string {
  if (n === undefined || n === null || n === 0 || Number.isNaN(n)) return '';
  return String(n);
}
