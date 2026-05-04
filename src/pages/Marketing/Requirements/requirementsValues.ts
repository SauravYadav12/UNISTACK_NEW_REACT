import { RequirementStatus } from '../../../Interfaces/reports';
import { IRequirement } from '../../../Interfaces/types';
import { ValidationMeta } from '../../../utils/validators';

export const reqStatusOptions: RequirementStatus[] = [
  'New Working',
  // Manual operator-set transitional state — picks up where "New Working"
  // ends and signals the consultant is actively being prepared / packaged
  // before the formal submission. Sits between New Working and Submitted
  // so the dropdown mirrors the natural workflow.
  'Submission in progress',
  'Submitted',
  'Interviewed',
  'Cancelled',
  'Project Active',
  'Project Inactive',
];

export const requirementFormInitialValues = {
  reqStatus: reqStatusOptions[0] || '',
  assignedTo: '',
  // assignedToRef: '',
  appliedFor: '',
  // appliedForRef: '',
  reqForm: '',
  primaryTechStack: '',
  resumeUpload: '',
  nextStep: '',
  taxType: [''],
  rate: [''],
  remote: [''],
  duration: [''],
  mComment: [],
  clientCompany: '',
  clientWebsite: '',
  clientAddress: '',
  clientPerson: '',
  clientPhone: '',
  clientEmail: '',
  primeVendorCompany: '',
  primeVendorWebsite: '',
  primeVendorName: '',
  primeVendorPhone: '',
  primeVendorEmail: '',
  vendorCompany: '',
  vendorWebsite: '',
  vendorPersonName: '',
  vendorPhone: '',
  vendorEmail: '',
  gotReqFrom: '',
  primaryTech: '',
  jobTitle: '',
  employmentType: '',
  jobPortalLink: '',
  reqEnteredBy: '',
  reqEnteredByRef: '',
  secondaryTech: '',
  jobDescription: '',
};

export const reqirementStatusColors: ReqirementStatusColors = {
  'New Working': '#37B7EA',
  // Teal bridges the cyan-blue of "New Working" and the green of "Submitted"
  // so the chip itself reads as a transition state on the pipeline strip.
  'Submission in progress': '#14B8A6',
  Submitted: '#10B981',
  Interviewed: '#EC4599',
  Cancelled: '#EF4444',
  'Project Active': '#F59E0B',
  'Project Inactive': '#94A3B8',
};

export const taxTypeOptions = [
  'C2C',
  '1099',
  'W2 With vendor',
  'W2 With client',
];

export const gotRequirementForm = [
  'Got from online Resume',
  "Received on consultant's Email",
  'Got through Job Portal',
];

export const techStack = [
  'Java',
  'Ruby',
  'React',
  'Angular',
  'Node',
  'PHP',
  'Python',
  'Dot Net',
  'MERN',
  'MEAN',
  'AWS',
  'Go Lang',
  'React Native',
  'Laravel',
  'Flutter',
  'SAP Consultant',
  'ETL',
  'QA/Tester',
  'Azure',
  'Other Frontend',
];

export const duration = [
  '03 Months',
  '06 Months',
  '12 Months',
  '12+ Months',
  'Full time',
];

export const requirementValidationMeta: ValidationMeta[] = [
  { field: 'reqStatus', required: true },
  // { field: 'assignedTo', required: true },
  { field: 'jobDescription', required: true },
  { field: 'vendorCompany', required: true },
];

type ReqirementStatusColors = {
  [key in RequirementStatus]: string;
};

export const reqFields:(keyof IRequirement)[] = [
  'reqStatus',
  'nextStep',
  'appliedFor',
  'appliedForRef',
  'assignedTo',
  'assignedToRef',
  'resume',
  'resumeUpload',
  'rate',
  'taxType',
  'remote',
  'duration',
  'clientCompany',
  'clientWebsite',
  'clientAddress',
  'clientPerson',
  'clientPhone',
  'clientEmail',
  'primeVendorCompany',
  'primeVendorWebsite',
  'primeVendorName',
  'primeVendorPhone',
  'primeVendorEmail',
  'vendorCompany',
  'vendorWebsite',
  'vendorPersonName',
  'vendorPhone',
  'vendorEmail',
  'reqEnteredDate',
  'gotReqFrom',
  'gotOnResume',
  'jobTitle',
  'employementType',
  'jobPortalLink',
  'reqEnteredBy',
  'reqEnteredByRef',
  'reqKeywords',
  'jobDescription',
  'recordOwner',
  'primaryTech',
  'secondaryTech',
  'updatedBy',
  'interviews',
  'primaryTechStack',
  'isDuplicate',
  'duplicateWith',
];

/**
 * Field-ownership split for multi-assign.
 *
 * Parent-owned fields describe the shared job itself (title, JD, tech
 * stack, employment type, job portal) plus the audit/attribution fields.
 * These never diverge between marketers.
 *
 * Everything else is child-owned: per-marketer commercial terms (rate, tax,
 * duration, remote), status + next step + comments + resume, applied-for
 * consultant, AND — per product rule — client info, prime-vendor info, and
 * vendor info. Each marketer may source through their own client contact
 * or prime vendor, so those rows diverge per assignment. Children inherit
 * the parent's initial values at creation time (see server's
 * CHILD_COPY_FIELDS) and can diverge afterwards.
 *
 * The drawers use this set to route save calls: dirty fields in this set go
 * to the parent doc; everything else goes to the child doc (or, on a
 * standalone/legacy row, back to the row itself).
 */
export const PARENT_OWNED_FIELD_SET = new Set<keyof IRequirement>([
  'jobTitle',
  'jobDescription',
  'employementType',
  'jobPortalLink',
  'primaryTech',
  'secondaryTech',
  'primaryTechStack',
  'reqKeywords',
  'recordOwner',
  'reqEnteredBy',
  'reqEnteredByRef',
  'reqEnteredDate',
  'gotReqFrom',
  'gotOnResume',
  'isDuplicate',
  'duplicateWith',
]);

/**
 * Fields that are editable on BOTH the parent and each child, where the
 * change stays on whichever record was open when the edit happened. This
 * lets a marketer override the client / prime-vendor / vendor contact for
 * just their assignment (a different recruiter at the same client, a
 * different prime, etc.) without overwriting the parent's canonical info,
 * AND lets support / admin keep the parent's record clean.
 *
 * Routing: dirty values land in the `shared` bucket of `splitDirtyByOwnership`
 * and are then merged into the patch for whichever doc the form is saving
 * (parent OR child).
 */
export const SHARED_EDITABLE_FIELD_SET = new Set<keyof IRequirement>([
  'clientCompany',
  'clientWebsite',
  'clientAddress',
  'clientPerson',
  'clientPhone',
  'clientEmail',
  'primeVendorCompany',
  'primeVendorWebsite',
  'primeVendorName',
  'primeVendorPhone',
  'primeVendorEmail',
  'vendorCompany',
  'vendorWebsite',
  'vendorPersonName',
  'vendorPhone',
  'vendorEmail',
]);

export function splitDirtyByOwnership(
  dirty: Partial<IRequirement>,
): {
  parent: Partial<IRequirement>;
  child: Partial<IRequirement>;
  shared: Partial<IRequirement>;
} {
  const parent: Partial<IRequirement> = {};
  const child: Partial<IRequirement> = {};
  const shared: Partial<IRequirement> = {};
  for (const k of Object.keys(dirty) as (keyof IRequirement)[]) {
    const v = dirty[k];
    if (SHARED_EDITABLE_FIELD_SET.has(k)) {
      (shared as Record<string, unknown>)[k as string] = v;
    } else if (PARENT_OWNED_FIELD_SET.has(k)) {
      (parent as Record<string, unknown>)[k as string] = v;
    } else {
      (child as Record<string, unknown>)[k as string] = v;
    }
  }
  return { parent, child, shared };
}
