import axios from 'axios';
import { getJwtToken } from '../utils/utils';
import { ApiQueryRes, PaginateResult } from '../Interfaces/pagination';
import { iSalesLead, SalesLeadComment } from '../Interfaces/salesLeads';

const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;

export async function updateSalesLead(
  profileId: string,
  body: Partial<iSalesLead>
) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.patch<ApiQueryRes<iSalesLead>>(
    `${BASE_URL}/sales-leads/${profileId}`,
    body,
    {
      headers,
    }
  );
  return response;
}

export async function getSalesLead(id: string) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.get<ApiQueryRes<iSalesLead>>(
    `${BASE_URL}/sales-leads/${id}`,
    {
      headers,
    }
  );
  return response;
}
export async function getSalesLeads(page = 1, limit = 25) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.get<ApiQueryRes<PaginateResult<iSalesLead>>>(
    `${BASE_URL}/sales-leads?page=${page}&limit=${limit}`,
    {
      headers,
    }
  );
  return response;
}
export async function deleteSalesLead(id: string) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.delete(`${BASE_URL}/sales-leads/${id}`, {
    headers,
  });
  return response;
}
export async function createComment(
  salesLeadId: string,
  comment: Omit<SalesLeadComment, '_id' | 'date'>
) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.post<ApiQueryRes<iSalesLead>>(
    `${BASE_URL}/sales-leads/${salesLeadId}/comments`,
    comment,
    {
      headers,
    }
  );
  return response;
}
export async function updateComment(
  salesLeadId: string,
  comment: SalesLeadComment
) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.patch<ApiQueryRes<iSalesLead>>(
    `${BASE_URL}/sales-leads/${salesLeadId}/comments/${comment._id}`,
    comment,
    {
      headers,
    }
  );
  return response;
}
export async function deleteComment(salesLeadId: string, commentId: string) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.delete(
    `${BASE_URL}/sales-leads/${salesLeadId}/comments/${commentId}`,
    {
      headers,
    }
  );
  return response;
}
