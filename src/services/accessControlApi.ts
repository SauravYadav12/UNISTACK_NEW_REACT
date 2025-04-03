import axios from 'axios';
import { ApiQueryRes } from '../Interfaces/apiRes';
import { getJwtToken } from '../utils/utils';
import { BASE_URL } from './userProfileApi';
import { iAccessControl } from '../utils/accessControlUtil';

export async function getAccessControl() {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };

  const url = `${BASE_URL}/access-control`;
  const response = await axios.get<ApiQueryRes<iAccessControl>>(url, {
    headers,
  });
  return response;
}
export async function updateAccessControl(id: string, values: Partial<iAccessControl>) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.patch<ApiQueryRes<iAccessControl>>(
    `${BASE_URL}/access-control/${id}`,
    values,
    {
      headers,
    }
  );
  return response;
}
