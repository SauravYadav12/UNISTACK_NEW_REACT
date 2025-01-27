import axios from 'axios';
import { getJwtToken } from '../utils/utils';
import { UserProfile } from '../Interfaces/profile';
import { iUser } from '../Interfaces/iUser';
import { ApiQueryRes, PaginateResult } from '../Interfaces/pagination';

const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;

export async function createProfile(
  userId: string,
  email: string,
  name: string
) {
  const body: Partial<UserProfile> = {
    user: userId,
    email: {
      personal: email,
      official: email,
    },
    name,
  };
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.post<ApiQueryRes<UserProfile>>(
    `${BASE_URL}/user-profiles`,
    body,
    {
      headers,
    }
  );
  return response;
}

export async function updateProfile(
  profileId: string,
  body: Partial<UserProfile>
) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.put<ApiQueryRes<UserProfile>>(
    `${BASE_URL}/user-profiles/${profileId}`,
    body,
    {
      headers,
    }
  );
  return response;
}
export async function getProfile(profileId: string) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.get<ApiQueryRes<UserProfile>>(
    `${BASE_URL}/user-profiles/${profileId}`,
    {
      headers,
    }
  );
  return response;
}
export async function getProfileByUser(user: iUser) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };

  const { data } = await axios.get<ApiQueryRes<PaginateResult<UserProfile>>>(
    `${BASE_URL}/user-profiles?user=${user.id}`,
    {
      headers,
    }
  );
  const { error } = data;
  if (error) return;
  const result = data.data?.results;
  if (result?.length) {
    return result[0];
  }
}
