import axios from 'axios';
import { getIUser, getJwtToken, myIpGeoLocation } from '../utils/utils';
import { iUser, jUser } from '../Interfaces/iUser';
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
  const clearSession = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };
  let headers: any = {
    'Content-Type': 'application/json',
  };
  let json = localStorage.getItem('user');
  if (!json) {
    clearSession();
    return;
  }
  const iuser = JSON.parse(json) as iUser;
  if (!iuser.id) {
    clearSession();
    return;
  }
  const { ip, location } = await myIpGeoLocation();
  const data = {
    location,
    ip,
    _id: iuser.id,
  };
  const response = await axios.post(`${BASE_URL}/users/logout`, data, {
    headers,
  });
  clearSession();
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

export const syncUserOnLocalStorage = async () => {
  try {
    const iUser = getIUser()!;
    const { data } = await usersList(`_id=${iUser.id}`);
    if (!data?.users?.length) return;
    console.log(data);
    const {
      _id,
      active,
      firstName,
      lastName,
      corpName,
      canEdit,
      email,
      role,
      premium,
      shift,
      workLocation,
    } = data.users[0] as jUser;
    const synciUser: iUser = {
      id: _id,
      active,
      canEdit,
      firstName,
      lastName,
      corpName,
      email,
      role,
      premium,
      shift,
      workLocation,
    };
    localStorage.setItem('user', JSON.stringify(synciUser));
  } catch (error) {
    console.warn('faild to sync');
  }
};

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
