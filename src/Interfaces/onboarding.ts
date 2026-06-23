/**
 * Shared types for the Onboarding feature.
 *
 * Mirrors the server's onboardingCandidateModel shape so both repos
 * agree on the wire format. `OnboardingStage` and the progress index
 * lookup are duplicated here (not imported from the server) so the
 * React bundle stays free of server-side Mongoose types.
 */

export type OnboardingStage =
  | 'invited'
  | 'form-submitted'
  | 'info-requested'
  | 'bg-check'
  | 'bg-check-passed'
  | 'offer-sent'
  | 'offer-signed'
  | 'onboarded'
  | 'rejected';

export const STAGE_PROGRESS_INDEX: Record<OnboardingStage, number> = {
  invited: 1,
  'form-submitted': 2,
  'info-requested': 2,
  'bg-check': 4,
  'bg-check-passed': 5,
  'offer-sent': 6,
  'offer-signed': 7,
  onboarded: 8,
  rejected: 0,
};

export const ONBOARDING_TOTAL_STEPS = 8;

// User-facing labels for the stepper + chips.
export const STAGE_LABELS: Record<OnboardingStage, string> = {
  invited: 'Invited',
  'form-submitted': 'Form Submitted',
  'info-requested': 'Info Requested',
  'bg-check': 'BG Check',
  'bg-check-passed': 'BG Check Passed',
  'offer-sent': 'Offer Sent',
  'offer-signed': 'Offer Signed',
  onboarded: 'Onboarded',
  rejected: 'Rejected',
};

// Four additional documents the candidate signs after the offer
// letter to complete onboarding. Kind + display label kept in sync
// with the server's onboardingDocTemplateModel.
export type OnboardingDocKind =
  | 'employment-agreement'
  | 'code-of-conduct'
  | 'nda'
  | 'leave-policy';

export const ONBOARDING_DOC_KINDS: OnboardingDocKind[] = [
  'employment-agreement',
  'code-of-conduct',
  'nda',
  'leave-policy',
];

export const ONBOARDING_DOC_LABELS: Record<OnboardingDocKind, string> = {
  'employment-agreement': 'Employment Agreement',
  'code-of-conduct': 'Code of Conduct',
  nda: 'Non-Disclosure Agreement',
  'leave-policy': 'Leave & Attendance Policy',
};

export interface OnboardingDocSection {
  heading: string;
  body: string;
}

export interface OnboardingDocTemplate {
  _id: string;
  kind: OnboardingDocKind;
  title: string;
  preamble: string;
  sections: OnboardingDocSection[];
  acknowledgment: string;
  signatoryName: string;
  signatoryTitle: string;
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyWebsite: string;
  directorSignatureDataUrl?: string;
  active: boolean;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingDocTemplateSnapshot {
  kind: OnboardingDocKind;
  title: string;
  preamble: string;
  sections: OnboardingDocSection[];
  acknowledgment: string;
  signatoryName: string;
  signatoryTitle: string;
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyWebsite: string;
  directorSignatureDataUrl?: string;
}

export interface OnboardingSignedAdditionalDoc {
  kind: OnboardingDocKind;
  signedAt: string;
  signatureMode: 'drawn' | 'typed';
  signatureDataUrl?: string;
  signatureTypedName?: string;
  signedFullName: string;
  signatureDate: string;
  signedByEmail?: string;
  signedFromIp?: string;
  signedFromUserAgent?: string;
  signedFromLocation?: OnboardingSignedLocation;
}

export interface OnboardingReference {
  name?: string;
  relationship?: string;
  phone?: string;
  email?: string;
}

export interface OnboardingFormData {
  dob?: string;
  address1?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  referredBy?: string;
  highestDegree?: string;
  collegeName?: string;
  degreeCompletionDate?: string;
  references?: OnboardingReference[];
  documents?: {
    resume?: string;
    passportPhoto?: string;
    panCard?: string;
    addressProof?: string;
    degreeCopy?: string;
    lastThreeSalarySlips?: string[];
  };
  candidateSignatureDataUrl?: string;
  submittedAt?: string;
}

export interface OnboardingOfferSnapshot {
  name: string;
  position: string;
  startDate: string;
  annualSalary: number;
  probationMonths: number;
}

export interface OnboardingOfferTemplateSnapshot {
  salutationTemplate: string;
  bodyTemplate: string;
  termsTemplate: string;
  closingTemplate: string;
  signatoryName: string;
  signatoryTitle: string;
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyWebsite: string;
  /** Director's signature image (base64 PNG) snapshotted at send-time
   *  so re-renders always show the right signature. */
  directorSignatureDataUrl?: string;
}

export interface OnboardingSignedLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface OnboardingOffer {
  sentAt?: string;
  signedAt?: string;
  snapshot: OnboardingOfferSnapshot;
  templateAtSendTime: OnboardingOfferTemplateSnapshot;
  signatureDataUrl?: string;
  signatureDate?: string;
  signedFullName?: string;
  // Digital verification metadata (populated at sign-time).
  signatureMode?: 'drawn' | 'typed';
  signatureTypedName?: string;
  signedByEmail?: string;
  signedFromIp?: string;
  signedFromUserAgent?: string;
  signedFromLocation?: OnboardingSignedLocation;
}

// Summary row from GET /onboarding/candidates (lightweight, no formData).
export interface OnboardingCandidateSummary {
  _id: string;
  candId: string;
  firstName: string;
  lastName: string;
  email: string;
  /** HR-recorded corporate email — the address the candidate will log
   *  in with after offer acceptance. Used as the primary match key for
   *  My Documents → Onboarding. Empty when HR hasn't filled it in. */
  officialEmail?: string;
  phone?: string;
  position: string;
  proposedStartDate: string;
  proposedAnnualSalary: number;
  probationMonths: number;
  stage: OnboardingStage;
  rejectionReason?: string;
  progressIndex: number;
  progressTotal: number;
  progressPercent: number;
  hasFormData: boolean;
  hasOffer: boolean;
  hasSignedOffer: boolean;
  /** True for records synthesised by the super-admin Backdated
   *  Onboarding flow (legacy / pre-portal employees). */
  isBackdated?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingAuditEntry {
  at: string;
  by?: string | null;
  byName: string;
  action: string;
  details?: string;
}

// Full doc from GET /onboarding/candidates/:id.
export interface OnboardingCandidate {
  _id: string;
  candId: string;
  firstName: string;
  lastName: string;
  email: string;
  /** See OnboardingCandidateSummary.officialEmail. */
  officialEmail?: string;
  phone?: string;
  position: string;
  proposedStartDate: string;
  proposedAnnualSalary: number;
  probationMonths: number;
  stage: OnboardingStage;
  rejectionReason?: string;
  formData?: OnboardingFormData;
  bgCheckStartedAt?: string;
  bgCheckCompletedAt?: string;
  offer?: OnboardingOffer;
  additionalDocSnapshots?: OnboardingDocTemplateSnapshot[];
  additionalSignedDocuments?: OnboardingSignedAdditionalDoc[];
  /** See OnboardingCandidateSummary.isBackdated. */
  isBackdated?: boolean;
  invitedBy: string;
  auditLog: OnboardingAuditEntry[];
  createdAt: string;
  updatedAt: string;
}

// Used both for the public-page resolution payload and the admin
// template editor.
export interface OfferLetterTemplate
  extends OnboardingOfferTemplateSnapshot {
  _id: string;
  active: boolean;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * The slimmed-down candidate shape the public endpoints return. Same
 * fields as the admin OnboardingCandidate minus the audit log + admin
 * references. Used by both `/p/onboarding/:token` (resolve) and
 * `/p/onboarding/:token/sign-offer` (the post-sign response now also
 * ships the updated candidate so the client can paint the
 * verification stamp without a second round-trip).
 */
export interface PublicCandidateView {
  candId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  proposedStartDate: string;
  probationMonths: number;
  formData?: OnboardingFormData;
  offer?: OnboardingOffer;
  stage: OnboardingStage;
  additionalDocSnapshots?: OnboardingDocTemplateSnapshot[];
  additionalSignedDocuments?: OnboardingSignedAdditionalDoc[];
}

/**
 * Response shape for GET /my-documents/onboarding — the employee-facing
 * "show me my signed onboarding paperwork" endpoint. The server resolves
 * the calling user → an OnboardingCandidate via lazy email match, so
 * this responds with either `hasOnboarding: false` (no candidate on
 * file for any email this user owns) or the full set of signed docs
 * ready for OfferLetterRender + DocumentLetterRender.
 */
export type MyOnboardingDocsResponse =
  | { hasOnboarding: false }
  | {
      hasOnboarding: true;
      candidate: {
        candId: string;
        firstName: string;
        lastName: string;
        position: string;
        stage: OnboardingStage;
      };
      offer: OnboardingOffer | null;
      additionalSignedDocuments: OnboardingSignedAdditionalDoc[];
      additionalDocSnapshots: OnboardingDocTemplateSnapshot[];
    };

// Public resolveToken payload.
export type ResolveTokenResult =
  | {
      ok: true;
      data: {
        purpose: 'onboarding-form' | 'offer-letter';
        expiresAt: string;
        candidate: PublicCandidateView;
      };
    }
  | {
      ok: false;
      reason: 'not-found' | 'expired' | 'consumed' | 'revoked' | 'candidate-missing';
    };
