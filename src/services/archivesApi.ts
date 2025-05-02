import axios from 'axios';
import { getJwtToken } from '../utils/utils';
import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';

export async function archiveRequirementsList(
  query: string = '',
  signal?: AbortSignal
) {
  const token = await getJwtToken();

  const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;

  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };

  const url = `${BASE_URL}/archives/requirements?${query}`;
  const response = await axios.get<ApiQueryRes<PaginationResult>>(url, {
    headers,
    signal,
  });
  return response;
}

export async function archiveInterviewsList(
  query: string = '',
  signal?: AbortSignal
) {
  const token = await getJwtToken();
  const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.get<ApiQueryRes<PaginationResult>>(
    `${BASE_URL}/archives/interviews?${query}`,
    {
      headers,
      signal,
    }
  );
  return response;
}
