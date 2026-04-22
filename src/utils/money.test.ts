import { describe, it, expect } from 'vitest';
import { formatMoney } from './money';

describe('formatMoney', () => {
  it('formats INR with Indian grouping', () => {
    expect(formatMoney(1234567.89, 'INR')).toMatch(/12,34,567/);
  });
  it('formats USD with American grouping', () => {
    expect(formatMoney(1234567.89, 'USD')).toMatch(/1,234,567/);
  });
  it('returns dash on NaN / Infinity', () => {
    expect(formatMoney(Number.NaN, 'USD')).toBe('—');
    expect(formatMoney(Number.POSITIVE_INFINITY, 'USD')).toBe('—');
  });
  it('respects maximumFractionDigits', () => {
    const s = formatMoney(1.239, 'USD', { maximumFractionDigits: 1 });
    expect(s).toContain('1.2');
  });
  it('renders unknown currency codes readably (code + amount)', () => {
    // Node's Intl accepts unknown 3-letter codes — it pads with U+00A0
    // (non-breaking space) which looks identical but doesn't string-equal a
    // regular space. So we just assert both parts are present.
    const s = formatMoney(100, 'ZZZ');
    expect(s).toMatch(/ZZZ/);
    expect(s).toMatch(/100/);
  });
});
