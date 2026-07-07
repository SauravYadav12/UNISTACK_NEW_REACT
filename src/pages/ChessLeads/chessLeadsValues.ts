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

export const INITIAL_CHESS_LEAD: ChessLeadPayload = {
  academyName: '',
  subscriptionDate: '',
  totalIds: undefined,
  mobileNumber: '',
  stateOrCity: '',
  pricingPerId: undefined,
  status: 'New',
  priority: 'Warm',
  reason: '',
  nextFollowUpDate: '',
};
