import axios from 'axios';
import { getJwtToken } from '../utils/utils';
import { UserProfile } from '../Interfaces/profile';
import { iUser } from '../Interfaces/iUser';
// import { emptyProfileTemplate } from '../pages/Marketing/Profile/constants';

const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;

export async function createProfile(userId: string) {
  const body: Partial<UserProfile> = {
    user: userId,
  };
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.post<UserProfileApiResponse>(
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
  const response = await axios.put<UserProfileApiResponse>(
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
  const response = await axios.get<UserProfileApiResponse>(
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
  const { data } = await axios.get<UserProfileApiResponse<UserQueryRes>>(
    `${BASE_URL}/user-profiles/`,
    {
      headers,
      data: {
        user: user.id,
      },
    }
  );
  const { error } = data;
  if (error) return;
  const result = data.data?.results;
  if (result?.length) {
    return result[0];
  }
}

export interface UserProfileApiResponse<T = UserProfile> {
  error?: any;
  data?: T;
  message?: string;
  status?: string;
}

interface UserQueryRes {
  results?: UserProfile[];
  currentPage?: number;
  totalPages?: number;
}
