import { axiosClient } from '../config/axios.config';
import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import { IOrganization } from '../Interfaces/organization';

export async function organizationsList(query: string = '', signal?: AbortSignal) {
  return axiosClient.get<ApiQueryRes<PaginationResult<IOrganization>>>(
    `/organizations/get-organizations?${query}`,
    { signal }
  );
}

export async function getOrganization(id: string) {
  return axiosClient.get<ApiQueryRes<IOrganization>>(
    `/organizations/get-organization/${id}`
  );
}

export async function createOrganization(payload: Partial<IOrganization>) {
  return axiosClient.post<ApiQueryRes<IOrganization>>(
    `/organizations/create-organization`,
    payload
  );
}

export async function updateOrganization(
  id: string,
  payload: Partial<IOrganization>
) {
  return axiosClient.patch<ApiQueryRes<IOrganization>>(
    `/organizations/update-organization/${id}`,
    payload
  );
}

export async function archiveOrganization(id: string) {
  return axiosClient.post<ApiQueryRes<IOrganization>>(
    `/organizations/${id}/archive`
  );
}

export async function activateOrganization(id: string) {
  return axiosClient.post<ApiQueryRes<IOrganization>>(
    `/organizations/${id}/activate`
  );
}
