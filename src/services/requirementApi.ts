import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import {
  CreateRequirementLogPayload,
  RequirementLog,
} from '../Interfaces/requirement';
import { IRequirement } from '../Interfaces/types';
import { axiosClient } from '../config/axios.config';

export interface RequirementSearchResponse {
  parent: IRequirement;
  assignments: IRequirement[];
  isParent: boolean;
  matchedReqID?: string;
  legacySelf: boolean;
}

export async function requirementsList(
  query: string = '',
  signal?: AbortSignal
) {
  const url = `/requirements/get-requirements?${query}`;
  const response = await axiosClient.get<ApiQueryRes<PaginationResult>>(url, {
    signal,
  });
  return response;
}

export async function createRequirement(data: Record<string, unknown>) {
  const response = await axiosClient.post(
    `/requirements/create-requirement`,
    data
  );
  return response;
}

export async function updateRequirement(
  id: string,
  payload: Record<string, unknown>
) {
  const response = await axiosClient.patch(
    `/requirements/update-requirement/${id}`,
    payload
  );
  return response;
}

export async function deleteRequirement(id: string) {
  const response = await axiosClient.delete(
    `/requirements/delete-requirement/${id}`
  );
  return response;
}

/**
 * Lightweight cycle-the-star endpoint. Doesn't go through the usual
 * updateRequirement (which logs every change) — star colour is UI
 * decoration HR shouldn't have polluting the audit trail. Optimistic
 * UI in the grid; this call is fire-and-forget from there.
 */
export type RequirementStarColor = 'none' | 'green' | 'yellow' | 'orange';

export async function updateRequirementStar(
  id: string,
  starColor: RequirementStarColor,
  signal?: AbortSignal,
) {
  return axiosClient.patch<{
    status: 'success' | 'failed';
    data?: { _id: string; reqID: string; starColor: RequirementStarColor };
  }>(`/requirements/${id}/star`, { starColor }, { signal });
}

export async function createRequirementLog(data: CreateRequirementLogPayload) {
  const response = await axiosClient.post(`/requirements/create-log`, data);

  return response;
}

export async function getRequirementLogs(
  query: string = '',
  signal?: AbortSignal
) {
  const url = `/requirements/get-log?${query}`;
  const response = await axiosClient.get<ApiQueryRes<RequirementLog[]>>(url, {
    signal,
  });
  return response;
}

export async function requirementCounts(
  date: string[] = [],
  filters: string = '',
  archive: boolean = false,
  signal?: AbortSignal
) {
  if (!date.length) {
    return [] as ApiQueryRes<{ date: string; count: number }[]>;
  }

  let dateQuery = '';

  date.forEach((d) => {
    dateQuery += `date=${d}&`;
  });
  const url = `/requirements/count-by-date?${dateQuery}${filters}&timezone=${Intl.DateTimeFormat().resolvedOptions().timeZone}&archive=${archive}`;
  const response = await axiosClient.get<
    ApiQueryRes<{ date: string; count: number }[]>
  >(url, {
    signal,
  });
  return response.data;
}


export async function generatePayLoadFromPrompt(content: string, instruction: string) {
  const response = await axiosClient.post(`/requirements/extract-from-content`, {
    content,
    instruction,
  });
  return response.data.data as Record<string, unknown>;
}

// ── Pipeline counts ──────────────────────────────────────────────────────

export interface PipelineCounts {
  all: number;
  allAssigned: number;
  byStatus: Record<string, number>;
}

/**
 * Aggregated counts for the `PipelineSnapshot` tiles. Replaces ~10 separate
 * `get-requirements?reqStatus=X&page=1&limit=1` calls — one request, one
 * server-side DB round-trip via `$facet`.
 */
export async function getPipelineCounts(archive: boolean = false) {
  const url = `/requirements/pipeline-counts?archive=${archive ? 'true' : 'false'}`;
  return axiosClient.get<ApiQueryRes<PipelineCounts>>(url);
}

// ── Multi-assign ─────────────────────────────────────────────────────────

export async function listChildAssignments(parentReqID: string) {
  const url = `/requirements/get-requirements?parentReqID=${encodeURIComponent(parentReqID)}`;
  const response = await axiosClient.get<ApiQueryRes<PaginationResult>>(url);
  return response;
}

export async function assignMarketers(
  parentReqID: string,
  assignments: Array<{ marketerRef: string; marketerName?: string }>
) {
  const response = await axiosClient.post<ApiQueryRes<IRequirement[]>>(
    `/requirements/${encodeURIComponent(parentReqID)}/assignments`,
    { assignments }
  );
  return response;
}

export async function unassignMarketer(childId: string) {
  const response = await axiosClient.delete(
    `/requirements/assignments/${childId}`
  );
  return response;
}

export async function searchRequirement(reqID: string) {
  // Stored reqIDs are always upper-case. Normalize here so callers don't
  // have to, and the server receives the canonical form on the wire.
  const normalized = reqID.trim().toUpperCase();
  const response = await axiosClient.get<ApiQueryRes<RequirementSearchResponse>>(
    `/requirements/search/${encodeURIComponent(normalized)}`
  );
  return response;
}
