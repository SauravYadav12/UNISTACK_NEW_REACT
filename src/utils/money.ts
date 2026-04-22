/**
 * Shared currency formatter. Uses Intl.NumberFormat so we get localized digit
 * grouping + currency symbols without a dependency. Safe for non-finite
 * inputs (returns a dash).
 */

const LOCALE_FOR_CURRENCY: Record<string, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'en-IE',
  GBP: 'en-GB',
};

export function formatMoney(
  amount: number,
  currency: string = 'USD',
  opts?: { maximumFractionDigits?: number }
): string {
  if (!Number.isFinite(amount)) return '—';
  const locale = LOCALE_FOR_CURRENCY[currency] || 'en-US';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: opts?.maximumFractionDigits ?? 2,
    }).format(amount);
  } catch {
    // Fallback when the runtime rejects an unknown currency code.
    return `${currency} ${amount.toFixed(2)}`;
  }
}
