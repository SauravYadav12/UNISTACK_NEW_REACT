export type ProjectStatus = 'Active' | 'On Hold' | 'Ended' | 'Terminated';
export type ContractScope = 'client' | 'vendor' | 'primeVendor' | 'other';

export interface IProjectAdditionalDetail {
  _id?: string;
  key: string;
  value: string;
  addedBy?: string;
  addedAt?: string;
}

export interface IProjectContract {
  _id?: string;
  scope: ContractScope;
  label?: string;
  url: string;
  fileName: string;
  sizeBytes?: number;
  uploadedBy?: string;
  uploadedAt?: string;
}

export type PaymentTermsPreset =
  | 'Net 15'
  | 'Net 30'
  | 'Net 45'
  | 'Net 60'
  | 'Custom';

export type DocStepStatus = 'Pending' | 'Done';

export interface IDocStep {
  status: DocStepStatus;
  completedOn?: string;
  notes?: string;
  attachmentUrl?: string;
}

export interface IProject {
  _id: string;
  projectId: string;
  reqID: string;
  requirementRef?: string;

  // Organization (frozen snapshot at project creation)
  organizationRef?: string;
  organizationName?: string;
  organizationShortCode?: string;
  organizationEIN?: string;
  organizationLogoUrl?: string;
  organizationAddress?: string;
  organizationEmail?: string;
  organizationWebsite?: string;

  // Billing metadata
  billingUnit?: 'hourly';
  paymentTerms?: { preset: PaymentTermsPreset; days: number };
  taxPercent?: number;
  invoiceRecipients?: {
    client: boolean;
    vendor: boolean;
    primeVendor: boolean;
    customEmails: string[];
  };

  documentation?: {
    bgc: IDocStep;
    contractSigned: IDocStep;
    paymentTermsAccepted: IDocStep;
    onboarding: IDocStep;
    extraNotes?: string;
  };

  // Seeded snapshot
  jobTitle?: string;
  consultant?: string;
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
  rate?: unknown[];
  taxType?: unknown[];
  duration?: unknown[];

  // Project-owned
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  notes?: string;
  additionalDetails?: IProjectAdditionalDetail[];
  contracts?: IProjectContract[];

  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}
