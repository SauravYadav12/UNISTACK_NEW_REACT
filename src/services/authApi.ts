import axios from 'axios';
import {
  getJwtToken,
  getUserIdFromToken,
  myIpGeoLocation,
} from '../utils/utils';
import { iUser } from '../Interfaces/iUser';
import { BASE_URL } from './userProfileApi';
// import { toast } from 'react-toastify';

export async function signup(data: any) {
  let headers: any = {
    'Content-Type': 'application/json',
  };
  const response = await axios.post(`${BASE_URL}/users/signup`, data, {
    headers,
  });
  return response;
}

export async function login(email: string, password: string) {
  let headers: any = {
    'Content-Type': 'application/json',
  };

  const { ip, location } = await myIpGeoLocation();
  // if(!location){
  //   toast.warning('Please allow location permission to proceed!')
  //   return
  // }
  const data = { email, password, ip, location };
  const response = await axios.post(`${BASE_URL}/users/login`, data, {
    headers,
  });
  return response;
}
export async function logout() {
  const id = getUserIdFromToken();
  let headers: any = {
    'Content-Type': 'application/json',
  };
  if (!id) {
    return;
  }
  const { ip, location } = await myIpGeoLocation();
  const data = {
    location,
    ip,
    _id: id,
  };
  const response = await axios.post(`${BASE_URL}/users/logout`, data, {
    headers,
  });
  return response;
}

export async function usersList(query = '') {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.get(`${BASE_URL}/users/list?${query}`, {
    headers,
  });
  return response;
}

export async function updateUser(id: any, payload: any) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.patch(`${BASE_URL}/users/${id}`, payload, {
    headers,
  });
  return response;
}

export async function syncIUser(id: string) {
  const token = await getJwtToken();
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const { data } = await axios.get<{ user?: iUser; error?: string }>(
    `${BASE_URL}/users/sync-iuser/${id}`,
    {
      headers,
    }
  );
  return data;
}

export async function sendOtp(
  email: string,
  otpFor: 'reset-password' | 'login'
) {
  let headers: any = {
    'Content-Type': 'application/json',
  };
  const response = await axios.post(
    `${BASE_URL}/users/send-${otpFor}-otp/${email}`,
    {},
    {
      headers,
    }
  );
  return response;
}

export async function verifyOtp(email: string, otp: string) {
  let headers: any = {
    'Content-Type': 'application/json',
  };
  const response = await axios.post(
    `${BASE_URL}/users/${email}/verify-otp/${otp}`,
    {},
    {
      headers,
    }
  );
  return response;
}
export async function resetPassword(
  password: string,
  email: string,
  otp: string
) {
  let headers: any = {
    'Content-Type': 'application/json',
  };
  const response = await axios.post(
    `${BASE_URL}/users/${email}/reset-password/${otp}`,
    { password },
    {
      headers,
    }
  );
  return response;
}
