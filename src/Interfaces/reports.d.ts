export interface DashboardReport {
  totalUsers: number;
  totalActiveUsers: number;
  totalRequirements: number;
  totalInterviews: number;
  totalConfirmInterviews: number;
}

export type SupportReport = {
  [key in RequirementStatus]?: number;
} & {
  name?: string;
  id?: string;
  totalPositions?: number;
};
export type MarketingReport = {
  [key in RequirementStatus]?: number;
} & {
  name?: string;
  id?: string;
  totalAssigned?: number;
};
export type InterviewReport = {
  [key in InterviewStatus]?: number;
} & {
  name?: string;
  id?: string;
  totalInterviews?: number;
};

export type RequirementStatus =
  | 'New Working'
  | 'Submitted'
  | 'Interviewed'
  | 'Cancelled'
  | 'Project Active'
  | 'Project Inactive';
export type InterviewStatus =
  | 'Interview Confirm'
  | 'Interview Tentative'
  | 'Interview Cancelled'
  | 'Interview Completed'
  | 'Interview Re-Scheduled';
