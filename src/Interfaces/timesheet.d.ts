export interface ITimesheetEntry {
  date: string;
  hours: number;
}

export interface ITimesheetScreenshot {
  _id?: string;
  weekStart: string;
  weekEnd: string;
  weekLabel?: string;
  url: string;
  fileName: string;
  sizeBytes?: number;
  uploadedBy?: string;
  uploadedAt?: string;
}

export interface ITimesheet {
  _id: string;
  projectRef: string;
  projectId: string;
  organizationRef: string;
  periodMonth: string;
  entries: ITimesheetEntry[];
  totalHours: number;
  allFilled: boolean;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  screenshots?: ITimesheetScreenshot[];
  filledBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TimesheetApprovalStatus = 'Pending' | 'Requested' | 'Approved' | 'Rejected';

export interface ITimesheetApproval {
  _id: string;
  projectRef: string;
  projectId: string;
  organizationRef: string;
  periodMonth: string;
  status: TimesheetApprovalStatus;
  timesheetIds: string[];
  totalHoursAtSubmission?: number;
  requestedAt?: string;
  requestedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  generatedInvoiceRef?: string;
  createdAt: string;
  updatedAt: string;
}
