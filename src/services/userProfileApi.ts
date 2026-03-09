
import { UserProfile } from '../Interfaces/profile';
import { iUser } from '../Interfaces/iUser';
import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import { axiosClient } from '../config/axios.config';


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

  const response = await axiosClient.post<ApiQueryRes<UserProfile>>(
    `/user-profiles`,
    body
  );
  return response;
}

export async function updateProfile(
  profileId: string,
  body: Partial<UserProfile>
) {
  const response = await axiosClient.patch<ApiQueryRes<UserProfile>>(
    `/user-profiles/${profileId}`,
    body
  );
  return response;
}
export async function getProfile(profileId: string) {
  const response = await axiosClient.get<ApiQueryRes<UserProfile>>(
    `/user-profiles/${profileId}`
  );
  return response;
}
export async function getProfileByUser(user: iUser) {
  const { data } = await axiosClient.get<
    ApiQueryRes<PaginationResult<UserProfile>>
  >(`/user-profiles?user=${user.id}`);
  const { error } = data;
  if (error) return;
  const result = data.data?.results;
  if (result?.length) {
    return result[0];
  }
}
