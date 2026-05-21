import { axiosClient } from '../config/axios.config';
import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import { IInterview } from '../Interfaces/types';
import {
  CreateInterviewLogPayload,
  InterviewLog,
} from '../Interfaces/interview';

export async function interviewsList(query: string = '', signal?: AbortSignal) {

  const response = await axiosClient.get<ApiQueryRes<PaginationResult>>(
    `/interviews/get-interviews?${query}`,
    {
      signal,
    }
  );
  return response;
}

export async function createInterview(data: Record<string, unknown>) {

  const response = await axiosClient.post<ApiQueryRes<IInterview>>(
    `/interviews/create-interview`,
    data
  );
  return response;
}

export async function updateInterview(id: string, values: Record<string, unknown>) {

  const response = await axiosClient.patch<ApiQueryRes<IInterview>>(
    `/interviews/update-interview/${id}`,
    values
  );
  return response;
}

export async function deleteInterview(id: string) {
  const response = await axiosClient.delete(
    `/interviews/delete-interview/${id}`
  );
  return response;
}

/**
 * Returns all interviews attached to this requirement AND any child
 * assignments beneath it. Used by the parent drawer so reviewers can see
 * per-marketer interview pipelines in one view. For legacy standalones or
 * parents without children, this returns the same data as the regular
 * `reqID=` filter.
 */
/**
 * Activity log writes — called from the InterviewForm after a successful
 * create / update / delete. Mirrors the requirement-log API.
 */
export async function createInterviewLog(data: CreateInterviewLogPayload) {
  const response = await axiosClient.post(`/interviews/create-log`, data);
  return response;
}

export async function getInterviewLogs(
  query: string = '',
  signal?: AbortSignal,
) {
  const url = `/interviews/get-log?${query}`;
  const response = await axiosClient.get<ApiQueryRes<InterviewLog[]>>(url, {
    signal,
  });
  return response;
}

export async function interviewsByParent(reqID: string, signal?: AbortSignal) {
  const response = await axiosClient.get<
    ApiQueryRes<{
      parentReqID: string;
      children: Array<{
        reqID: string;
        childSuffix?: string;
        assignedTo?: string;
        assignedToRef?: string;
      }>;
      results: IInterview[];
    }>
  >(`/interviews/by-parent/${encodeURIComponent(reqID)}`, { signal });
  return response;
}

