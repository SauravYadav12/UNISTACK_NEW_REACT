/**
 * Typed wrappers for the onboarding HTTP endpoints. Both admin
 * surface (`/onboarding/...`) and the candidate public surface
 * (`/p/onboarding/:token`) live here so the React panels + public
 * pages share the same fetch helpers.
 */

import { axiosClient } from '../config/axios.config';
import {
  OnboardingCandidate,
  OnboardingCandidateSummary,
  OfferLetterTemplate,
  PublicCandidateView,
  ResolveTokenResult,
} from '../Interfaces/onboarding';

// ── Admin endpoints ─────────────────────────────────────────────

export async function listCandidates() {
  const res = await axiosClient.get<{ data: OnboardingCandidateSummary[] }>(
    '/onboarding/candidates',
  );
  return res.data;
}

export async function getCandidate(id: string) {
  const res = await axiosClient.get<{ data: OnboardingCandidate }>(
    `/onboarding/candidates/${id}`,
  );
  return res.data;
}

export interface CreateCandidatePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  proposedStartDate: string;
  proposedAnnualSalary: number;
  probationMonths?: number;
}

export async function createCandidate(payload: CreateCandidatePayload) {
  const res = await axiosClient.post<{ data: OnboardingCandidateSummary }>(
    '/onboarding/candidates',
    payload,
  );
  return res.data;
}

export async function requestInfo(
  id: string,
  subject: string,
  body: string,
) {
  const res = await axiosClient.post<{ data: OnboardingCandidateSummary }>(
    `/onboarding/candidates/${id}/request-info`,
    { subject, body },
  );
  return res.data;
}

export async function markInfoReceived(id: string) {
  const res = await axiosClient.post<{ data: OnboardingCandidateSummary }>(
    `/onboarding/candidates/${id}/mark-info-received`,
    {},
  );
  return res.data;
}

export async function startBgCheck(id: string) {
  const res = await axiosClient.post<{ data: OnboardingCandidateSummary }>(
    `/onboarding/candidates/${id}/start-bg-check`,
    {},
  );
  return res.data;
}

export async function completeBgCheck(
  id: string,
  passed: boolean,
  notes?: string,
) {
  const res = await axiosClient.post<{ data: OnboardingCandidateSummary }>(
    `/onboarding/candidates/${id}/complete-bg-check`,
    { passed, notes },
  );
  return res.data;
}

export interface SendOfferPayload {
  name: string;
  position: string;
  startDate: string;
  annualSalary: number;
  probationMonths: number;
}

export async function sendOffer(id: string, payload: SendOfferPayload) {
  const res = await axiosClient.post<{ data: OnboardingCandidateSummary }>(
    `/onboarding/candidates/${id}/send-offer`,
    payload,
  );
  return res.data;
}

export async function resendLink(
  id: string,
  purpose: 'onboarding-form' | 'offer-letter',
) {
  const res = await axiosClient.post<{ data: OnboardingCandidateSummary }>(
    `/onboarding/candidates/${id}/resend-link`,
    { purpose },
  );
  return res.data;
}

export async function rejectCandidate(id: string, reason: string) {
  const res = await axiosClient.post<{ data: OnboardingCandidateSummary }>(
    `/onboarding/candidates/${id}/reject`,
    { reason },
  );
  return res.data;
}

export interface DeleteCandidateResult {
  candId: string;
  filesAttempted: number;
  filesRemoved: number;
  tokensRemoved: number;
}

export async function deleteCandidate(id: string) {
  const res = await axiosClient.delete<{ data: DeleteCandidateResult }>(
    `/onboarding/candidates/${id}`,
  );
  return res.data;
}

// ── Template editor (super-admin) ───────────────────────────────

export async function getOfferTemplate() {
  const res = await axiosClient.get<{ data: OfferLetterTemplate }>(
    '/onboarding/template',
  );
  return res.data;
}

export async function updateOfferTemplate(
  patch: Partial<OfferLetterTemplate>,
) {
  const res = await axiosClient.patch<{ data: OfferLetterTemplate }>(
    '/onboarding/template',
    patch,
  );
  return res.data;
}

// ── Candidate public surface ────────────────────────────────────

export async function resolvePublicToken(
  token: string,
): Promise<ResolveTokenResult> {
  try {
    const res = await axiosClient.get<ResolveTokenResult>(
      `/p/onboarding/${token}`,
    );
    return res.data;
  } catch (e) {
    const err = e as {
      response?: { data?: ResolveTokenResult; status?: number };
    };
    // 410 = our standard "invalid/expired/consumed" — surface as ok:false.
    if (err.response?.data && 'ok' in err.response.data) {
      return err.response.data;
    }
    return { ok: false, reason: 'not-found' };
  }
}

export async function submitPublicForm(
  token: string,
  payload: Record<string, unknown>,
) {
  const res = await axiosClient.post<{ ok: boolean }>(
    `/p/onboarding/${token}/submit-form`,
    payload,
  );
  return res.data;
}

export interface SignOfferPayload {
  signedFullName: string;
  signatureDate: string;
  signatureMode: 'drawn' | 'typed';
  // Required when signatureMode === 'drawn'. Unused for typed mode
  // (renderer paints the name in a cursive font instead).
  signatureDataUrl?: string;
  signatureTypedName?: string;
  geoLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export interface SignOfferResponse {
  ok: boolean;
  data?: {
    candidate: PublicCandidateView;
  };
}

export async function signPublicOffer(
  token: string,
  payload: SignOfferPayload,
): Promise<SignOfferResponse> {
  // The server returns the updated candidate alongside `ok: true` so
  // the client can render the post-sign view (verification stamp,
  // cursive signature, server-stamped IP/geo) without making a second
  // resolve-token round-trip.
  const res = await axiosClient.post<SignOfferResponse>(
    `/p/onboarding/${token}/sign-offer`,
    payload,
  );
  return res.data;
}
