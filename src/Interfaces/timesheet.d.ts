export interface ITimesheetEntry {
  date: string;
  hours: number;
}

export interface ITimesheetScreenshotSlot {
  _id?: string;
  label: string;
}

export interface ITimesheetScreenshot {
  _id?: string;
  /** Binds the screenshot to a slot in `ITimesheet.screenshotSlots`. */
  slotId?: string;
  /** Legacy / optional now that slots are free-text. */
  weekStart?: string;
  weekEnd?: string;
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
  screenshotSlots?: ITimesheetScreenshotSlot[];
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
