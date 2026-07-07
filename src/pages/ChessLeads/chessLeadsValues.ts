import { ChessLeadPayload, ChessLeadPriority, ChessLeadStatus } from '../../Interfaces/chessLead';
import { tokens } from '../../theme/theme';

export const CHESS_LEAD_STATUSES: ChessLeadStatus[] = [
  'New',
  'Renewed',
  'Not renewed',
  'Not converted',
];

export const CHESS_LEAD_PRIORITIES: ChessLeadPriority[] = ['Hot', 'Warm', 'Cold'];

/** Consistent chip colours across grid, drawer, dashboard, chart. */
export const CHESS_STATUS_COLORS: Record<ChessLeadStatus, string> = {
  New: tokens.colors.blueDark,
  Renewed: '#10B981',
  'Not renewed': '#F59E0B',
  'Not converted': '#EF4444',
};

export const CHESS_PRIORITY_COLORS: Record<ChessLeadPriority, string> = {
  Hot: '#EF4444',
  Warm: '#F59E0B',
  Cold: tokens.colors.blueDark,
};

/** Derived pricing numbers used across the form, the drawer, and the
 *  grid so the math is centralised. Returns 0s when inputs are missing
 *  so callers never render `NaN` cells. */
export function computePricing(
  totalIds?: number,
  pricingPerId?: number,
  gstPercent?: number,
): { subtotal: number; gstAmount: number; grandTotal: number } {
  const q = Number.isFinite(totalIds) ? Number(totalIds) : 0;
  const p = Number.isFinite(pricingPerId) ? Number(pricingPerId) : 0;
  const g = Number.isFinite(gstPercent) ? Number(gstPercent) : 0;
  const subtotal = q * p;
  const gstAmount = Math.round((subtotal * g) / 100 * 100) / 100;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    gstAmount,
    grandTotal: Math.round((subtotal + gstAmount) * 100) / 100,
  };
}

export const INITIAL_CHESS_LEAD: ChessLeadPayload = {
  academyName: '',
  subscriptionDate: '',
  totalIds: undefined,
  mobileNumber: '',
  stateOrCity: '',
  country: 'India',
  countryIso: 'IN',
  state: '',
  stateIso: '',
  city: '',
  pricingPerId: undefined,
  gstPercent: 18,
  status: 'New',
  priority: 'Warm',
  reason: '',
  nextFollowUpDate: '',
  lastRenewalDate: '',
};
