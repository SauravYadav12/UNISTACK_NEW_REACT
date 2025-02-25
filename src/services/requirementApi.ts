import axios from 'axios';
import { getJwtToken } from '../utils/utils';
import { ApiQueryRes, PaginationInstance } from '../Interfaces/apiRes';

export async function requirementsList(query?: string) {
  const token = await getJwtToken();

  const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;

  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };

  const url = `${BASE_URL}/requirements/get-requirements?${query}`;
  const response = await axios.get<ApiQueryRes<PaginationInstance>>(url, {
    headers,
  });
  return response;
}

export async function createRequirement(data: any) {
  const token = await getJwtToken();
  const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.post(
    `${BASE_URL}/requirements/create-requirement`,
    data,
    {
      headers,
    }
  );
  return response;
}

export async function updateRequirement(id: any, payload: any) {
  const token = await getJwtToken();
  const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.patch(
    `${BASE_URL}/requirements/update-requirement/${id}`,
    payload,
    {
      headers,
    }
  );
  return response;
}

export async function deleteRequirement(id: string) {
  const token = await getJwtToken();
  const BASE_URL: string = import.meta.env.VITE_API_BASE_URL;
  const headers = {
    Authorization: token,
  };
  const response = await axios.delete(
    `${BASE_URL}/requirements/delete-requirement/${id}`,
    { headers }
  );
  return response;
}
