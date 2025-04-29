export interface CreateLeavePayload {
  userRef: string;
  name: string;
  startDate: string;
  endDate: string;
  type: LeaveType;
  reason: string;
  isHalfDay: boolean;
  halfDayType?: HalfDayType;
}

export interface iLeave extends CreateLeavePayload {
  _id: string;
  status: LeaveStatus;
  respondBy?: string;
  respondedAt?: string;
  rejectionReason?: string;
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
}

export enum HalfDayType {
  FirstHalf = 'First Half',
  SecondHalf = 'Second Half',
}
