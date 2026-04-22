export type PerformanceRole = 'marketing' | 'support';

export type ScoreLineKind = 'positive' | 'penalty';

export interface ScoreLine {
  key: string;
  label: string;
  count: number;
  weight: number;
  points: number;
  kind: ScoreLineKind;
}

export interface MarketingMetrics {
  submissions: number;
  /** Currently in "Interview Confirm" — client-facing only. */
  interviewsConfirmed: number;
  /** Reached "Interview Completed" — client-facing only. */
  interviewsCompleted: number;
  /** Confirmed past its scheduled date — reschedule / no-show / dropped. */
  staleConfirmedInterviews: number;
  staleSubmissions: number;
  unworkedRequirements: number;
  conversionPct: number;
}

export interface SupportMetrics {
  requirementsEntered: number;
  entriesReachedSubmitted: number;
  entriesReachedInterviewed: number;
  /** Parent credited when any child lands in Project Active / Inactive. */
  entriesReachedProject: number;
  unprogressedEntries: number;
  duplicatesEntered: number;
}

export interface LeaderboardRow<M = MarketingMetrics | SupportMetrics> {
  user: {
    _id: string;
    name: string;
    email: string;
    active: boolean;
  };
  metrics: M;
  breakdown: ScoreLine[];
  score: number;
  rawTotal: number;
  rank: number;
}

export interface PerformanceWindow {
  from: string;
  to: string;
}

export interface LeaderboardResponse<M = MarketingMetrics | SupportMetrics> {
  window: PerformanceWindow;
  weights: Record<string, number>;
  rows: LeaderboardRow<M>[];
}

export interface WeightsAuditEntry {
  _id?: string;
  changedBy?: string;
  changedByName?: string;
  changedAt: string;
  before: Record<string, number>;
  after: Record<string, number>;
  reason?: string;
}

export interface WeightsBlock {
  weights: Record<string, number>;
  defaults: Record<string, number>;
  audit: WeightsAuditEntry[];
  updatedAt: string;
}

export interface WeightsResponse {
  marketing: WeightsBlock;
  support: WeightsBlock;
}
