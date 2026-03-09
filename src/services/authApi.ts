import {
  getJwtToken,
  getUserIdFromToken,
  myIpGeoLocation,
} from '../utils/utils';
import { iUser } from '../Interfaces/iUser';
import { axiosClient } from '../config/axios.config';
import { ApiQueryRes } from '../Interfaces/apiRes';

export async function signup(data: Record<string, string>) {
  const response = await axiosClient.post(`/users/signup`, data, {});
  return response;
}

export async function login(email: string, password: string) {
  const { ip, location } = await myIpGeoLocation();
  const data = { email, password, ip, location };
  const response = await axiosClient.post(`/users/login`, data, {});
  return response;
}

export async function logout() {
  const id = getUserIdFromToken();

  if (!id) {
    return;
  }

  const { ip, location } = await myIpGeoLocation();
  const data = {
    location,
    ip,
    _id: id,
  };

  const response = await axiosClient.post(`/users/logout`, data, {});
  return response;
}

export async function usersList(query = '') {
  const response = await axiosClient.get<{ users: iUser[] }>(`/users/list?${query}`, {});
  return response;
}

export async function updateUser(id: string, payload: Partial<iUser>) {

  const response = await axiosClient.patch(`/users/${id}`, payload, {});
  return response;
}

export async function syncIUser(id: string) {
  const { data } = await axiosClient.get<{ user?: iUser; error?: string }>(
    `/users/sync-iuser/${id}`,
    {}
  );
  return data;
}

export async function sendOtp(
  email: string,
  otpFor: 'reset-password' | 'login'
) {
  const response = await axiosClient.post(
    `/users/send-${otpFor}-otp/${email}`,
    {},
    {}
  );
  return response;
}

export async function verifyOtp(email: string, otp: string) {
  const response = await axiosClient.post(
    `/users/${email}/verify-otp/${otp}`,
    {},
    {}
  );
  return response;
}
export async function resetPassword(
  password: string,
  email: string,
  otp: string
) {
  const response = await axiosClient.post(
    `/users/${email}/reset-password/${otp}`,
    { password },
    {}
  );
  return response;
}
