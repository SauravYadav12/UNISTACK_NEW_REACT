import axios from 'axios';
import { getJwtToken } from '../utils/utils';
import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import { BASE_URL } from './userProfileApi';

export async function interviewsList(query: string = '', signal?: AbortSignal) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.get<ApiQueryRes<PaginationResult>>(
    `${BASE_URL}/interviews/get-interviews?${query}`,
    {
      headers,
      signal,
    }
  );
  return response;
}

export async function createInterview(data: any) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.post(
    `${BASE_URL}/interviews/create-interview`,
    data,
    {
      headers,
    }
  );
  return response;
}

export async function updateInterview(id: any, values: any) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.patch(
    `${BASE_URL}/interviews/update-interview/${id}`,
    values,
    {
      headers,
    }
  );
  return response;
}

export async function deleteInterview(id: string) {
  const token = await getJwtToken();
  const headers = {
    Authorization: token,
  };
  const response = await axios.delete(
    `${BASE_URL}/interviews/delete-interview/${id}`,
    { headers }
  );
  return response;
}
