import axios from 'axios';
import {
  getIUser,
  getJwtToken,
  myIpGeoLocation,
} from '../utils/utils';
import { toast } from 'react-toastify';

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
  if(!location){
    toast.warning('Please allow location permission to proceed!')
    return
  }
  data = { ...data, ip, location };
  const response = await axios.post(`${BASE_URL}/users/login`, data, {
    headers,
  });
  return response;
}
export async function logout() {
  const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
  let headers: any = {
    'Content-Type': 'application/json',
  };
  const iuser = getIUser();
  if (!iuser) return;
  const { ip, location } = await myIpGeoLocation();
  const data = {
    location,
    ip,
    _id: iuser.id,
  };
  const response = await axios.post(`${BASE_URL}/users/logout`, data, {
    headers,
  });
  return response;
}

export async function usersList() {
  const token = await getJwtToken();
  const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
  let headers: any = {
    'Content-Type': 'application/json',
    Authorization: token,
  };
  const response = await axios.get(`${BASE_URL}/users/list`, {
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
