
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

/**
 * Create a UserProfile with an arbitrary body. Used by the Profile form on
 * the first save for a user that doesn't have a profile doc yet (e.g., a
 * freshly-created super-admin). Pairs with `updateProfile` — the form
 * picks one based on whether `_id` is populated.
 */
export async function createUserProfile(body: Partial<UserProfile>) {
  const response = await axiosClient.post<ApiQueryRes<UserProfile>>(
    `/user-profiles`,
    body,
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
