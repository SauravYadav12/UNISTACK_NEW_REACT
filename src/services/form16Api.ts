/**
 * Typed wrappers for the Form-16 module endpoints.
 *
 * Admin endpoints are super-admin gated server-side, so calls from
 * non-super-admin contexts will 403. The employee endpoint is
 * JWT-gated; the server scopes results to the calling user.
 */

import { axiosClient } from '../config/axios.config';
import {
  Form16,
  Form16BulkResult,
  Form16BulkRow,
  Form16LookupEmployee,
  MyForm16,
} from '../Interfaces/form16';

// ── Admin ──────────────────────────────────────────────────────────

export interface ListForm16Options {
  fiscalYearStart?: number;
  published?: boolean;
}

export async function listForm16(opts: ListForm16Options = {}) {
  const params: Record<string, string> = {};
  if (opts.fiscalYearStart != null) {
    params.fiscalYearStart = String(opts.fiscalYearStart);
  }
  if (opts.published !== undefined) {
    params.published = String(opts.published);
  }
  const res = await axiosClient.get<{ data: Form16[] }>('/form16', { params });
  return res.data;
}

export interface CreateForm16Payload {
  userId: string;
  fiscalYearStart: number;
  fileUrl: string;
  originalFilename?: string;
  fileSizeBytes?: number;
}

export async function createForm16(payload: CreateForm16Payload) {
  const res = await axiosClient.post<{ data: Form16 }>('/form16', payload);
  return res.data;
}

export interface BulkCreateForm16Payload {
  publishImmediately?: boolean;
  rows: Form16BulkRow[];
}

export async function bulkCreateForm16(payload: BulkCreateForm16Payload) {
  const res = await axiosClient.post<{ data: Form16BulkResult }>(
    '/form16/bulk',
    payload,
  );
  return res.data;
}

export async function publishForm16(id: string) {
  const res = await axiosClient.post<{ data: Form16 }>(
    `/form16/${id}/publish`,
  );
  return res.data;
}

export async function unpublishForm16(id: string) {
  const res = await axiosClient.post<{ data: Form16 }>(
    `/form16/${id}/unpublish`,
  );
  return res.data;
}

export async function publishAllForFY(fiscalYearStart: number) {
  const res = await axiosClient.post<{
    data: { fiscalYearStart: number; modifiedCount: number };
  }>('/form16/publish-bulk', { fiscalYearStart });
  return res.data;
}

export async function deleteForm16(id: string) {
  const res = await axiosClient.delete<{ data: { deleted: boolean; id: string } }>(
    `/form16/${id}`,
  );
  return res.data;
}

export async function getForm16Lookup() {
  const res = await axiosClient.get<{ data: Form16LookupEmployee[] }>(
    '/form16/lookup',
  );
  return res.data;
}

// ── Employee ───────────────────────────────────────────────────────

export async function getMyForm16s() {
  const res = await axiosClient.get<{ data: MyForm16[] }>(
    '/my-documents/form16',
  );
  return res.data;
}
