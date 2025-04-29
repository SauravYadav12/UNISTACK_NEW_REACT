import axios from 'axios';
import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import { CreateLeavePayload, iLeave } from '../Interfaces/leaves';
import { getJwtToken } from '../utils/utils';
import { BASE_URL } from './userProfileApi';

export async function getLeaves(query = '') {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.get<ApiQueryRes<PaginationResult<iLeave>>>(
    `${BASE_URL}/leaves?${query}`,

    {
      headers,
    }
  );
  return response;
}

export async function createLeave(data: CreateLeavePayload) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.post<ApiQueryRes<iLeave>>(
    `${BASE_URL}/leaves`,
    data,
    {
      headers,
    }
  );
  return response;
}
