import axios from 'axios';
import { getJwtToken } from '../utils/utils';
import { ApiQueryRes, PaginationInstance } from '../Interfaces/apiRes';

export async function archiveRequirementsList(query: string = '') {
  const token = await getJwtToken();

  const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;

  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };

  const url = `${BASE_URL}/archives/requirements?${query}`;
  const response = await axios.get<ApiQueryRes<PaginationInstance>>(url, {
    headers,
  });
  return response;
}

export async function archiveInterviewsList(query: string = '') {
  const token = await getJwtToken();
  const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.get<ApiQueryRes<PaginationInstance>>(
    `${BASE_URL}/archives/interviews?${query}`,
    {
      headers,
    }
  );
  return response;
}
