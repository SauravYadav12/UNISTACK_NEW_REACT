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
