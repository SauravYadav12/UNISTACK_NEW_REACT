// Mirrors the server SourcedJobModel (the IT Job Search review queue).

export type SourcedJobSource = 'email' | 'jsearch' | 'feed' | 'discovered';
export type SourcedJobStatus = 'pending' | 'approved' | 'rejected' | 'duplicate';
export type WorkAuth = 'usc-gc-ok' | 'needs-sponsorship' | 'unknown';

export interface SourcedJob {
  _id: string;

  // Requirement-shaped fields (editable before approval)
  jobTitle?: string;
  jobDescription?: string;
  employementType?: string;
  jobPortalLink?: string;
  reqKeywords?: string;
  recordOwner?: string;
  primaryTech?: string;
  secondaryTech?: string;
  primaryTechStack?: string;
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
  rate?: string[];
  taxType?: string[];
  remote?: string[];
  duration?: string[];

  // Source + classification metadata
  source: SourcedJobSource;
  sourceName?: string;
  sourceRef?: string;
  receivedAt: string;
  rawExcerpt?: string;
  is100Remote?: boolean;
  remoteScopeUS?: boolean;
  isTechnical?: boolean;
  workAuth: WorkAuth;
  seniority?: string;
  confidence?: number;
  hasVendorContact: boolean;

  status: SourcedJobStatus;
  reviewedAt?: string;
  createdRequirementRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SourcedJobListResponse {
  results: SourcedJob[];
  total: number;
  page: number;
  limit: number;
}

// The fields a reviewer may edit before approving.
export type SourcedJobEditable = Partial<
  Pick<
    SourcedJob,
    | 'jobTitle'
    | 'jobDescription'
    | 'employementType'
    | 'jobPortalLink'
    | 'reqKeywords'
    | 'recordOwner'
    | 'primaryTech'
    | 'secondaryTech'
    | 'primaryTechStack'
    | 'clientCompany'
    | 'clientWebsite'
    | 'clientAddress'
    | 'clientPerson'
    | 'clientPhone'
    | 'clientEmail'
    | 'primeVendorCompany'
    | 'primeVendorWebsite'
    | 'primeVendorName'
    | 'primeVendorPhone'
    | 'primeVendorEmail'
    | 'vendorCompany'
    | 'vendorWebsite'
    | 'vendorPersonName'
    | 'vendorPhone'
    | 'vendorEmail'
    | 'rate'
    | 'taxType'
    | 'remote'
    | 'duration'
  >
>;
