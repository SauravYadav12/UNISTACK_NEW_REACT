import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import { axiosClient } from '../config/axios.config';

export async function vendorInterviewsList(
  query: string = '',
  signal?: AbortSignal
) {
  const response = await axiosClient.get<ApiQueryRes<PaginationResult>>(
    `/vendors/get-interviews?${query}`,
    {
      signal,
    }
  );
  return response;
}

export async function createVendorInterview(data: Record<string, unknown>) {
  const response = await axiosClient.post(`/vendors/create-interview`, data);
  return response;
}

export async function updateVendorInterview(
  id: string,
  values: Record<string, unknown>
) {
  const response = await axiosClient.patch(
    `/vendors/update-interview/${id}`,
    values
  );
  return response;
}

export async function deleteVendorInterview(id: string) {
  const response = await axiosClient.delete(`/vendors/delete-interview/${id}`);
  return response;
}
