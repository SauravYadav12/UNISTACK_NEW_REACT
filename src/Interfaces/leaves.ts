export interface LeaveSplitItem {
  leaveType: string;
  days: number;
}

export interface CreateLeavePayload {
  userRef: string;
  name: string;
  startDate: string;
  endDate: string;
  // `type` kept as a string for backwards compatibility (legacy enum values +
  // dynamic leave-type names). `leaveType` is the canonical ObjectId ref.
  type?: LeaveType | string;
  leaveType?: string;
  reason: string;
  isHalfDay: boolean;
  halfDayType?: HalfDayType;
  attachments?: string[];
  // Precomputed split so the server records it verbatim. If omitted, the
  // server computes a split itself from the current month's quota.
  splitBreakdown?: LeaveSplitItem[];
}

export interface iLeave extends CreateLeavePayload {
  _id: string;
  status: LeaveStatus;
  respondBy?: string;
  respondedAt?: string;
  rejectionReason?: string;
  paymentCategory?: 'Paid' | 'Unpaid' | 'Medical';
  splitBreakdown?: LeaveSplitItem[];
  createdAt: string;
}

export enum LeaveType {
  CasualLeave = 'Casual Leave',
  SickLeave = 'Sick Leave',
  AnnualLeave = 'Annual Leave',
  Other = 'Other',
}

export enum LeaveStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Revoked = 'Revoked',
}

export enum HalfDayType {
  FirstHalf = 'First Half',
  SecondHalf = 'Second Half',
}
