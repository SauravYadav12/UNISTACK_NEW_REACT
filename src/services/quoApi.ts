import { axiosClient } from '../config/axios.config';
import ENV_VARS from '../config/env.config';
import { getJwtToken } from '../utils/utils';
import {
  QuoActivityEvent,
  QuoCall,
  QuoMessage,
  QuoPhoneNumber,
  QuoVoicemail,
} from '../Interfaces/quo';

// ── Phone numbers ────────────────────────────────────────────────

export async function listQuoPhoneNumbers() {
  const res = await axiosClient.get<{ data: QuoPhoneNumber[] }>(
    '/quo/phone-numbers',
  );
  return res.data.data;
}

export async function syncQuoPhoneNumbers() {
  const res = await axiosClient.post<{ data: QuoPhoneNumber[] }>(
    '/quo/phone-numbers/sync',
  );
  return res.data.data;
}

export async function patchQuoPhoneNumberLabel(id: string, label: string) {
  const res = await axiosClient.patch<{ data: QuoPhoneNumber }>(
    `/quo/phone-numbers/${id}/label`,
    { label },
  );
  return res.data.data;
}

export async function reconcileQuoPhoneNumber(id: string) {
  const res = await axiosClient.post<{
    data: {
      reconciled: boolean;
      since: string;
      counts: { messages: number; calls: number };
    };
  }>(`/quo/phone-numbers/${id}/reconcile`);
  return res.data.data;
}

// ── Timeline reads ────────────────────────────────────────────────

export interface TimelineParams {
  phoneNumberId?: string;
  from?: string; // ISO
  to?: string; // ISO
  since?: string; // ISO — overrides from/to for delta poll
  direction?: 'incoming' | 'outgoing';
  search?: string;
  page?: number;
  limit?: number;
  conversationId?: string;
}

function toParams(p: TimelineParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined && v !== null && v !== '') out[k] = String(v);
  }
  return out;
}

export async function listQuoActivity(params: TimelineParams) {
  const res = await axiosClient.get<{
    data: { rows: QuoActivityEvent[]; total: number };
  }>('/quo/activity', { params: toParams(params) });
  return res.data.data;
}

export async function listQuoCalls(params: TimelineParams) {
  const res = await axiosClient.get<{
    data: { rows: QuoCall[]; total: number };
  }>('/quo/calls', { params: toParams(params) });
  return res.data.data;
}

export async function listQuoMessages(params: TimelineParams) {
  const res = await axiosClient.get<{
    data: { rows: QuoMessage[]; total: number };
  }>('/quo/messages', { params: toParams(params) });
  return res.data.data;
}

export async function listQuoVoicemails(params: TimelineParams) {
  const res = await axiosClient.get<{
    data: { rows: QuoVoicemail[]; total: number };
  }>('/quo/voicemails', { params: toParams(params) });
  return res.data.data;
}

// ── Audio proxy URLs (built, not fetched) ────────────────────────
// The audio element itself makes the request — we just build a
// URL that carries the current JWT so the audio tag can auth. Since
// the axios interceptor sets Authorization on XHR, we can't reuse it
// for an <audio src>. Instead we sign the URL with a `?token=` param
// that our server accepts on this specific endpoint.
//
// Simpler approach used here: use fetch to pre-resolve the redirect
// URL via a signed one-time request, and pass the resulting URL to
// <audio>. See AudioPlayer.tsx.

export function quoRecordingUrl(callId: string) {
  return `${ENV_VARS.BASE_URL}/quo/calls/${encodeURIComponent(callId)}/recording`;
}

export function quoVoicemailUrl(callId: string) {
  return `${ENV_VARS.BASE_URL}/quo/calls/${encodeURIComponent(callId)}/voicemail`;
}

/**
 * Resolve a Quo signed URL for the audio element to load. Because
 * <audio src> can't carry an Authorization header, we do a fetch
 * with credentials, follow the 302 manually, and hand the resulting
 * mp3 URL to <audio>.
 */
export async function resolveQuoAudioUrl(kind: 'recording' | 'voicemail', callId: string) {
  const url =
    kind === 'recording' ? quoRecordingUrl(callId) : quoVoicemailUrl(callId);
  const token = await getJwtToken();
  const res = await fetch(url, {
    method: 'GET',
    redirect: 'manual',
    headers: { Authorization: token || '' },
  });
  // manual redirect: response is `opaqueredirect` in browsers with no
  // header visibility. Fall back to letting the browser follow the
  // redirect itself — safe because the redirect target is a signed
  // Quo URL that doesn't require our JWT.
  if (res.status === 0 || res.type === 'opaqueredirect') {
    const followed = await fetch(url, {
      method: 'GET',
      headers: { Authorization: token || '' },
    });
    return followed.url;
  }
  const loc = res.headers.get('location');
  if (loc) return loc;
  return res.url;
}

// ── Summary + transcript pull-through ────────────────────────────

export async function getQuoCallSummary(callId: string) {
  const res = await axiosClient.get<{
    data: { status: string; summary?: string; nextSteps?: string[] };
  }>(`/quo/calls/${encodeURIComponent(callId)}/summary`);
  return res.data.data;
}

export async function getQuoCallTranscript(callId: string) {
  const res = await axiosClient.get<{
    data: {
      status: string;
      dialogue?: Array<{
        content: string;
        start: number;
        end: number;
        identifier: string;
        userId?: string;
      }>;
    };
  }>(`/quo/calls/${encodeURIComponent(callId)}/transcript`);
  return res.data.data;
}
