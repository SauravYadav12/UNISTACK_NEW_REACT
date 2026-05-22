/**
 * Types shared between the JobBoards page, its context, and the service.
 *
 * Keep this file thin — the server is the source of truth for the
 * payload shape; mirror it here without business logic.
 */

export type JobPublisher =
  | 'Indeed'
  | 'LinkedIn'
  | 'ZipRecruiter'
  | 'Glassdoor'
  | 'Dice'
  | 'Monster'
  | 'Other';

export interface NormalizedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  publisher: JobPublisher;
  applyUrl: string;
  postedAt: string;
  employmentType: string;
  salary: string;
  description: string;
  isRemote: boolean;
}

export type DatePostedFilter = 'all' | 'today' | '3days' | 'week' | 'month';
export type EmploymentTypeFilter =
  | 'FULLTIME'
  | 'CONTRACTOR'
  | 'PARTTIME'
  | 'INTERN';

export interface JobSearchRequest {
  query: string;
  location: string;
  datePosted?: DatePostedFilter;
  employmentType?: EmploymentTypeFilter;
  remoteOnly?: boolean;
  forceRefresh?: boolean;
}

export interface JobSearchQuota {
  remaining?: number;
  limit?: number;
}

export interface JobSearchResponse {
  jobs: NormalizedJob[];
  byPublisher: Record<string, NormalizedJob[]>;
  quota?: JobSearchQuota;
  fetchedAt: string;
  fromCache: boolean;
  quotaExceeded?: boolean;
  retryAfter?: string;
}
