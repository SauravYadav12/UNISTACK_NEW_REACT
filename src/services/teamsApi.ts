
import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import { ITeam } from '../Interfaces/types';
import { axiosClient } from '../config/axios.config';

export async function teamsList(query: string = '', signal?: AbortSignal) {
  const response = await axiosClient.get<ApiQueryRes<PaginationResult>>(
    `/teams/get-teams?${query}`,
    {
      signal,
    }
  );
  return response;
}

export async function createTeam(data: Record<string, unknown>) {
  const response = await axiosClient.post<{ data: ITeam }>(`/teams/create-team`, data);
  return response;
}

export async function updateTeam(id: string, values: Record<string, unknown>) {
  const response = await axiosClient.patch<{ data: ITeam }>(`/teams/update-team/${id}`, values);
  return response;
}

export async function deleteTeam(id: string) {
  const response = await axiosClient.delete(`/teams/delete-team/${id}`);
  return response;
}
