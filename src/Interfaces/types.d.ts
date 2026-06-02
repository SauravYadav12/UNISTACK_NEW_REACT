import { UserShift, WorkLocation, UserRole } from './iUser';

// Teams Interface
export interface ITeam {
  _id: string;
  teamId: string;
  teamName?: string;
  teckStack?: string;
  developerName?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Attendance Interface
export interface IAttendance {
  _id: string;
  userRef: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status?: 'Present' | 'Absent' | 'Late' | 'Half-Day';
  createdAt: string;
  updatedAt: string;
}

// Requirement Interface
export interface IRequirement {
  _id: string;
  reqID: string;
  reqStatus?: string;
  nextStep?: string;
  appliedFor?: string;
  appliedForRef?: string;
  assignedTo?: string;
  assignedToRef?: string;
  resume?: string;
  resumeUpload?: string;
  rate?: string[];
  taxType?: string[];
  remote?: string[];
  duration?: string[];
  mComment?: {
    username: string;
    date: Date;
    comment: string;
  }[];
  clientCompany?: string;
  clientWebsite?: string;
  clientAddress?: string;
  clientPerson?: string;
  clientPhone?: string;
  clientEmail?: string;
  primeVendorCompany?: string;
  primeVendorWebsite?: string;
  primeVendorName?: string;
  primeVendorPhone?: string;
  primeVendorEmail?: string;
  vendorCompany?: string;
  vendorWebsite?: string;
  vendorPersonName?: string;
  vendorPhone?: string;
  vendorEmail?: string;
  reqEnteredDate?: string;
  gotReqFrom?: string;
  gotOnResume?: string;
  jobTitle?: string;
  employementType?: string;
  jobPortalLink?: string;
  reqEnteredBy?: string;
  reqEnteredByRef: string;
  reqKeywords?: string;
  jobDescription?: string;
  recordOwner?: string;
  primaryTech?: string;
  secondaryTech?: string;
  updatedBy?: string;
  interviews?: unknown[];
  primaryTechStack?: string;
  isDuplicate?: string;
  duplicateWith?: string;
  parentReqID?: string;
  childSuffix?: string;
  /** Star colour any team member can cycle (transparent → green →
   *  yellow → orange → transparent). Only meaningful on parent rows
   *  (those without `parentReqID`). 'none' renders as a transparent
   *  outline; the others as a filled star in that colour. */
  starColor?: 'none' | 'green' | 'yellow' | 'orange';
  /** Server-enriched flag on parent rows — `true` when at least one child
   *  row exists with `parentReqID === this.reqID`. The grid uses it to
   *  render the expand chevron only on parents that actually have
   *  children, so legacy standalone parents stay clean. Always set on the
   *  server response; never persisted on the doc itself. */
  hasChildren?: boolean;
  /**
   * Populated by `GET /requirements/search/:reqID` only — inline info about
   * the project this requirement is already attached to, if any. Used by
   * SearchRequirement to show "Project PROJ-12 · ACME" on each assignment
   * row and to disable the Select button inside AddProjectDialog.
   */
  project?: {
    projectId?: string;
    organizationShortCode?: string;
    organizationName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Consultant Interface
export interface IConsultant {
  _id: string;
  consultantId: string;
  consultantName?: string;
  consultantStatus?: string;
  visaStatus?: string;
  currentAddress?: string;
  previousAddress?: string;
  email?: string;
  phone?: string;
  skypeId?: string;
  dob?: string | null;
  ssn?: string;
  dlNo?: string;
  degree?: string;
  university?: string;
  yearPassing?: string;
  timeZone?: string;
  projects?: IConsultantProject[];
  psuedoName?: string;
  getVisa?: string;
  cameToUsYear?: string;
  originCountry?: string;
  lookingToChange?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type IConsultantProject = {
  projectNumber?: string;
  projectName?: string;
  projectCity?: string;
  projectState?: string;
  projectStartDate?: string | null;
  projectEndDate?: string | null;
  projectDescription?: string;
  isCurrent?: boolean;
  projectDomain?: string;
};

// Leave Interface
export interface ILeave {
  _id: string;
  userRef: string;
  name: string;
  startDate: string;
  endDate: string;
  reason?: string;
  type?: 'Sick Leave' | 'Casual Leave' | 'Annual Leave' | 'Other';
  status?: 'Pending' | 'Approved' | 'Rejected';
  respondBy?: string;
  respondedAt?: string;
  rejectionReason?: string;
  isHalfDay?: boolean;
  halfDayType?: 'First Half' | 'Second Half';
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

// Holiday Interface
export interface IHoliday {
  _id: string;
  name?: string;
  description?: string;
  fromDate: string;
  toDate: string;
  isHalfDay?: boolean;
  halfDayType?: 'First Half' | 'Second Half';
  createdAt: string;
  updatedAt: string;
}

// Interview Interface
export interface IInterview {
  _id: string;
  intId: string;
  interviewDate?: string | null;
  interviewTime?: string | null;
  interviewType?: string;
  interviewStatus?: string;
  intResult?: string;
  consultant?: string;
  consultantRef?: string;
  marketingPerson?: string;
  marketingPersonRef?: string;
  vendorCompany?: string;
  primeVendorCompany?: string;
  tentativeReason?: string;
  gitHubLink?: string;
  codeLink?: string;
  result?: string;
  subjectLine?: string;
  interviewMode?: string;
  interviewLink?: string;
  interviewFocus?: string;
  jobDescription?: string;
  interviewFeedback?: string;
  taxType?: string[];
  clientName?: string;
  duration?: string[];
  candidateName?: string;
  candidateRef?: string;
  teckStack?: string;
  developerName?: string;
  recordOwner?: string;
  reqID?: string;
  recordId?: string;
  interviewRound?: string;
  interviewViaMode?: string;
  meetingType?: string;
  interviewDuration?: string;
  interviewWith?: string;
  jobTitle?: string;
  timeShift?: string;
  timeZone?: string;
  updatedBy?: string;
  remarks?: string;
  specialNote?: string;
  script?: string;
  createdAt: string;
  updatedAt: string;
}

// Access Control Interface (Flexible schema)
export interface IAccessControl {
  _id: string;
  [key: string]: unknown; // Since it uses strict: false
  createdAt: string;
  updatedAt: string;
}

// Vendor Interface
export interface IVendor {
  _id: string;
  testID: string;
  interviewDate?: string | null;
  interviewTime?: string | null;
  interviewType?: string;
  interviewStatus?: string;
  intResult?: string;
  consultant?: string;
  consultantRef?: string;
  marketingPerson?: string;
  marketingPersonRef?: string;
  vendorCompany?: string;
  primeVendorCompany?: string;
  tentativeReason?: string;
  gitHubLink?: string;
  codeLink?: string;
  result?: string;
  subjectLine?: string;
  interviewMode?: string;
  interviewLink?: string;
  interviewFocus?: string;
  jobDescription?: string;
  interviewFeedback?: string;
  taxType?: string[];
  clientName?: string;
  duration?: string[];
  candidateName?: string;
  candidateRef?: string;
  teckStack?: string;
  developerName?: string;
  recordOwner?: string;
  reqID?: string;
  recordId?: string;
  interviewRound?: string;
  interviewViaMode?: string;
  meetingType?: string;
  interviewDuration?: string;
  interviewWith?: string;
  jobTitle?: string;
  timeShift?: string;
  timeZone?: string;
  updatedBy?: string;
  remarks?: string;
  specialNote?: string;
  script?: string;
  createdAt: string;
  updatedAt: string;
}

// Requirement Log Interface
export interface IRequirementLog {
  _id: string;
  requirementRef: string;
  operation: 'create' | 'update' | 'delete';
  userName: string;
  userRef: string;
  oldData?: Partial<unknown>;
  newData: Partial<unknown>;
  createdAt: string;
  updatedAt: string;
}

// Sales Lead Comment Interface (used in SalesLead)
export interface ISalesLeadComment {
  _id: string;
  name: string;
  commentBy: string;
  comment: string;
  date?: string;
}

// Re-export all interfaces and types for convenience
export * from './apiRes.d';
export * from './holiday.d';
export * from './iUser';
export * from './leaves';
export * from './profile';
export * from './reports.d';
export * from './requirement.d';
export * from './salesLeads.d';
