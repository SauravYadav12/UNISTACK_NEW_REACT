export type ChessLeadStatus =
  | 'New'
  | 'Renewed'
  | 'Not renewed'
  | 'Not converted';

export type ChessLeadPriority = 'Hot' | 'Warm' | 'Cold';

export interface ChessLead {
  _id: string;
  leadId: string;
  academyName: string;
  subscriptionDate?: string;
  totalIds?: number;
  mobileNumber?: string;
  /** @deprecated — legacy free-text location. New rows populate the
   *  country / state / city triplet below; this stays for backward
   *  compat + free-text search. */
  stateOrCity?: string;
  country?: string;
  countryIso?: string;
  state?: string;
  stateIso?: string;
  city?: string;
  pricingPerId?: number;
  /** GST rate (%) applied on top of totalIds × pricingPerId. Defaults
   *  to 18 server-side. Kept editable per-lead for the occasional 0 %
   *  / 5 % client. */
  gstPercent?: number;
  status: ChessLeadStatus;
  priority: ChessLeadPriority;
  reason?: string;
  nextFollowUpDate?: string;
  lastRenewalDate?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChessLeadListResponse {
  results: ChessLead[];
  totalDocuments: number;
  page: number;
  limit: number;
}

export interface ChessLeadStats {
  total: number;
  statusCounts: Record<ChessLeadStatus, number>;
  priorityCounts: Record<ChessLeadPriority, number>;
  followUpsDueToday: number;
  followUpsOverdue: number;
  mrr: number;
}

export interface ChessLeadLog {
  _id: string;
  leadRef: string;
  leadId: string;
  operation: 'create' | 'update' | 'delete';
  userName: string;
  userRef: string;
  oldData?: Partial<ChessLead>;
  newData?: Partial<ChessLead>;
  createdAt: string;
  updatedAt: string;
}

export type ChessLeadPayload = Partial<Omit<ChessLead, '_id' | 'leadId' | 'createdBy' | 'createdByName' | 'createdAt' | 'updatedAt'>>;
