/**
 * TypeScript mirror of the server's PulseBundle. Keep field names in
 * lock-step with `server/services/employeeActivityService.ts`.
 */

export type PulseGroupBy =
  | 'jobTitle'
  | 'primaryTech'
  | 'secondaryTech'
  | 'primaryTechStack'
  | 'clientCompany'
  | 'employementType'
  | 'taxType'
  | 'remote';

export type PulseBucket = 'day' | 'week' | 'biweek' | 'month';
export type PulseMetric =
  | 'positions'
  | 'submissions'
  | 'interviewsCompleted'
  | 'offers'
  | 'score';

export interface PulseUser {
  userId: string;
  name: string;
  email: string;
  role: string[];
}

export interface PulseKpi {
  userId: string;
  role: 'marketing' | 'support' | 'mixed';
  score: number;
  submissions: number;
  interviewsConfirmed: number;
  interviewsCompleted: number;
  offers: number;
  /**
   * Snapshot counts of the user's owned reqs, keyed by current reqStatus
   * ("New Working", "Submission in progress", "Submitted", "Interviewed",
   * "Project Active", "Project Inactive", "Cancelled"). Missing key ⇒ 0.
   */
  statusCounts: Record<string, number>;
  activeDayStreak: number;
  sparkline: number[];
}

export interface PulseTrendSeries {
  name: string;
  data: number[];
}

export interface PulseTrend {
  groupBy: PulseGroupBy;
  bucket: PulseBucket;
  metric: PulseMetric;
  xAxis: string[];
  series: PulseTrendSeries[];
  truncated: boolean;
  totalSeries: number;
  perEmployeeOverlay?: Array<{ userId: string; name: string; data: number[] }>;
}

// ─── Proactivity Board ────────────────────────────────────────────

export interface PulseProactivityActor {
  userId: string;
  name: string;
  firstActionAt: string; // ISO
  /** Always "comment" today — first comment on any child of the parent
   *  is the winning action. Kept as a union for forward compatibility. */
  firstActionKind: 'comment';
  /** reqID of the child requirement the winning comment was placed on. */
  childReqID?: string;
  msFromEntry: number;
}

export interface PulseProactivityReq {
  parentReqID: string;
  jobTitle: string;
  clientCompany: string;
  enteredAt: string; // ISO
  enteredBy: { userId?: string; name: string };
  actors: PulseProactivityActor[];
}

export interface PulseProactivityLeader {
  userId: string;
  name: string;
  firstPlaceCount: number;
  secondPlaceCount: number;
  thirdOrLaterCount: number;
  totalActedOn: number;
  medianMsToAct: number | null;
}

export interface PulseProactivity {
  window: { from: string; to: string };
  totals: {
    positionsEntered: number;
    childrenCreated: number;
    unclaimedParents: number;
  };
  reqs: PulseProactivityReq[];
  leaderboard: PulseProactivityLeader[];
}

export interface PulseBundle {
  window: { from: string; to: string };
  users: PulseUser[];
  kpis: PulseKpi[];
  metricsGrid: Record<string, Record<string, number>>;
  trend: PulseTrend;
  proactivity: PulseProactivity;
}

/**
 * Requirement-form filter set surfaced by the FilterDrawer. Mirrors the
 * PulseReqFilter shape on the server.
 */
export interface PulseReqFilter {
  reqStatus?: string[];
  assignedToRef?: string;
  reqEnteredByRef?: string;
  appliedForRef?: string;
  recordOwner?: string;
  starColor?: string[];
  isDuplicate?: string;
  jobTitle?: string;
  employementType?: string[];
  primaryTech?: string;
  secondaryTech?: string;
  primaryTechStack?: string;
  gotOnResume?: string;
  rateMin?: number;
  rateMax?: number;
  taxType?: string[];
  remote?: string[];
  duration?: string[];
  clientCompany?: string;
  clientPerson?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientWebsite?: string;
  clientAddress?: string;
  primeVendorCompany?: string;
  primeVendorName?: string;
  primeVendorEmail?: string;
  primeVendorPhone?: string;
  primeVendorWebsite?: string;
  vendorCompany?: string;
  vendorPersonName?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  vendorWebsite?: string;
  gotReqFrom?: string;
  jobPortalLink?: string;
  parentReqID?: string;
  childSuffix?: string;
  reqEnteredFrom?: string;
  reqEnteredTo?: string;
}

export interface PulseEmployeeRow {
  userId: string;
  name: string;
  email: string;
  role: string[];
}

/**
 * One row of the status drilldown drawer. Matches the shape returned by
 * `GET /employee-pulse/status-drilldown`. `relevantField` names the
 * timestamp that qualified this req into the requested status window so
 * the drawer can display it alongside the row.
 */
export interface PulseStatusDrilldownReq {
  reqID: string;
  reqStatus: string;
  jobTitle: string;
  clientCompany: string;
  primaryTech?: string;
  createdAt: string;
  updatedAt: string;
  relevantAt: string;
  relevantField:
    | 'createdAt'
    | 'updatedAt'
    | '_perfSubmittedAt'
    | '_perfInterviewedAt'
    | '_perfProjectActiveAt'
    | '_perfProjectInactiveAt';
}
