import axios from 'axios';
import { getJwtToken } from '../utils/utils';
import { BASE_URL } from './userProfileApi';
import { ApiQueryRes } from '../Interfaces/apiRes';
import { Holiday } from '../Interfaces/holiday';
export async function getHolidays(query = '') {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.get<ApiQueryRes<Holiday[]>>(
    `${BASE_URL}/holidays?${query}`,

    {
      headers,
    }
  );
  return response;
}
export async function markHoliday(
  body: Partial<Omit<Holiday, '_id' | 'createdAt' | 'updatedAt'>>
) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.post<ApiQueryRes<Holiday>>(
    `${BASE_URL}/holidays/`,
    body,
    {
      headers,
    }
  );
  return response;
}

export async function updateHoliday(
  id: string,
  body: Partial<Omit<Holiday, '_id' | 'createdAt' | 'updatedAt'>>
) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.patch<ApiQueryRes<Holiday>>(
    `${BASE_URL}/holidays/${id}`,

    body,

    {
      headers,
    }
  );
  return response;
}
export async function deleteHoliday(id: string) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.delete(
    `${BASE_URL}/holidays/${id}`,

    {
      headers,
    }
  );
  return response;
}
