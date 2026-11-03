export type PipStatus = 'draft' | 'active' | 'successful' | 'failed';

export type PipReason =
  | 'performance'
  | 'punctuality'
  | 'late-comings'
  | 'non-productive-45'
  | 'other';

export const PIP_REASON_OPTIONS: { key: PipReason; label: string }[] = [
  { key: 'performance', label: 'Performance issues' },
  { key: 'punctuality', label: 'Punctuality' },
  { key: 'late-comings', label: 'Too many late comings' },
  { key: 'non-productive-45', label: 'Non-productive for more than 45 days' },
  { key: 'other', label: 'Other (specify)' },
];

export const PIP_REASON_LABELS: Record<PipReason, string> = {
  performance: 'Performance issues',
  punctuality: 'Punctuality',
  'late-comings': 'Too many late comings',
  'non-productive-45': 'Non-productive for more than 45 days',
  other: 'Other',
};

export const PIP_STATUS_LABELS: Record<PipStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  successful: 'Successful',
  failed: 'Failed',
};

export interface PipExtension {
  days: number;
  at: string;
  byRef?: string;
}

export interface Pip {
  _id: string;
  employeeRef: string;
  employeeName: string;
  employeeEmail?: string;
  reasons: PipReason[];
  otherReason?: string;
  emailSubject: string;
  emailBody: string;
  status: PipStatus;
  startDate?: string;
  originalEndDate?: string;
  endDate?: string;
  durationDays: number;
  extensionDays: number;
  extensions: PipExtension[];
  sentAt?: string;
  completionNotifiedAt?: string;
  resolutionNote?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}
