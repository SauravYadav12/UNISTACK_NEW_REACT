import { axiosClient } from '../config/axios.config';
import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import { IInterview } from '../Interfaces/types';

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

