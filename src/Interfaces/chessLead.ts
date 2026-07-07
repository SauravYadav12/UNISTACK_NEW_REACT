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
  stateOrCity?: string;
  pricingPerId?: number;
  status: ChessLeadStatus;
  priority: ChessLeadPriority;
  reason?: string;
  nextFollowUpDate?: string;
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
