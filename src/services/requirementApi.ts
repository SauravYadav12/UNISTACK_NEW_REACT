import axios from 'axios';
import { getJwtToken } from '../utils/utils';
import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import { BASE_URL } from './userProfileApi';

export async function requirementsList(
  query: string = '',
  signal?: AbortSignal
) {
  const token = await getJwtToken();

  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };

  const url = `${BASE_URL}/requirements/get-requirements?${query}`;
  const response = await axios.get<ApiQueryRes<PaginationResult>>(url, {
    headers,
    signal,
  });
  return response;
}

export async function createRequirement(data: any) {
  const token = await getJwtToken();
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
  const headers = {
    Authorization: token,
  };
  const response = await axios.delete(
    `${BASE_URL}/requirements/delete-requirement/${id}`,
    { headers }
  );
  return response;
}
