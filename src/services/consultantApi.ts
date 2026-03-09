import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import { axiosClient } from '../config/axios.config';

export async function consultantsList(
  query: string = '',
  signal?: AbortSignal
) {
  const response = await axiosClient.get<ApiQueryRes<PaginationResult>>(
    `/consultants/get-consultants?${query}`,
    {
      signal,
    }
  );
  return response;
}

export async function createConsultant(data: Record<string, unknown>) {
  const response = await axiosClient.post(
    `/consultants/create-consultant`,
    data
  );

  return response;
}

export async function updateConsultant(
  id: string,
  values: Record<string, unknown>
) {
  const response = await axiosClient.patch(
    `/consultants/update-consultant/${id}`,
    values
  );
  return response;
}

export async function deleteConsultant(id: string) {
  const response = await axiosClient.delete(
    `/consultants/delete-consultant/${id}`
  );
  return response;
}
