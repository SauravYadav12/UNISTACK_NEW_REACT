import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import {
  CreateRequirementLogPayload,
  RequirementLog,
} from '../Interfaces/requirement';
import { axiosClient } from '../config/axios.config';

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