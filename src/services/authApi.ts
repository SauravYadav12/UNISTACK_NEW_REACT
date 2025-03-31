import axios from 'axios';
import { getIUser, getJwtToken, myIpGeoLocation } from '../utils/utils';
import { iUser, jUser } from '../Interfaces/iUser';
// import { toast } from 'react-toastify';

export async function signup(data: any) {
  const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
  let headers: any = {
    'Content-Type': 'application/json',
  };
  const response = await axios.post(`${BASE_URL}/users/signup`, data, {
    headers,
  });
  return response;
}

export async function login(data: any) {
  const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
  let headers: any = {
    'Content-Type': 'application/json',
  };

  data = Object.fromEntries(data);

  const { ip, location } = await myIpGeoLocation();
  // if(!location){
  //   toast.warning('Please allow location permission to proceed!')
  //   return
  // }
  data = { ...data, ip, location };
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
  const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
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
  const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
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
  const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
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
    };
    localStorage.setItem('user', JSON.stringify(synciUser));
  } catch (error) {
    console.warn('faild to sync');
  }
};
