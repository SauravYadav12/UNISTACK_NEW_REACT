
import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import { iSalesLead, SalesLeadComment } from '../Interfaces/salesLeads';
import { axiosClient } from '../config/axios.config';

export async function getSalesLeads(query: string = '', signal?: AbortSignal) {
  const response = await axiosClient.get<
    ApiQueryRes<PaginationResult<iSalesLead>>
  >(`/sales-leads?${query}`, {
    signal,
  });
  return response;
}

export async function updateSalesLead(
  profileId: string,
  body: Partial<iSalesLead>
) {
  const response = await axiosClient.patch<ApiQueryRes<iSalesLead>>(
    `/sales-leads/${profileId}`,
    body
  );
  return response;
}

export async function getSalesLead(id: string) {
  const response = await axiosClient.get<ApiQueryRes<iSalesLead>>(
    `/sales-leads/${id}`
  );
  return response;
}

export async function deleteSalesLead(id: string) {
  const response = await axiosClient.delete(`/sales-leads/${id}`);
  return response;
}
export async function createComment(
  salesLeadId: string,
  comment: Omit<SalesLeadComment, '_id' | 'date'>
) {
  const response = await axiosClient.post<ApiQueryRes<iSalesLead>>(
    `/sales-leads/${salesLeadId}/comments`,
    comment
  );
  return response;
}
