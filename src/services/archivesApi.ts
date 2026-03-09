import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import { axiosClient } from '../config/axios.config';

export async function archiveRequirementsList(
  query: string = '',
  signal?: AbortSignal
) {
  const url = `/archives/requirements?${query}`;
  const response = await axiosClient.get<ApiQueryRes<PaginationResult>>(url, {
    signal,
  });
  return response;
}

export async function archiveInterviewsList(
  query: string = '',
  signal?: AbortSignal
) {
  const url = `/archives/interviews?${query}`;
  const response = await axiosClient.get<ApiQueryRes<PaginationResult>>(url, {
    signal,
  });

  return response;
}
