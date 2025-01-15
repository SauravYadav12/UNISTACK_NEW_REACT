import axios from "axios";
import { getJwtToken } from "../utils/utils";

export async function signup(data: any) {
  const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
  let headers: any = {
    "Content-Type": "application/json"
    // 'Authorization': 'JWT fefege...'
  };
  const response = await axios.post(`${BASE_URL}/users/signup`, data, {
    headers
  });
  return response;
}

export async function login(data: any) {
  const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
  let headers: any = {
    "Content-Type": "application/json"
    // 'Authorization': 'JWT fefege...'
  };
  const response = await axios.post(`${BASE_URL}/users/login`, data, {
    headers
  });
  return response;
}

export async function usersList() {
  const token = await getJwtToken();
  const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
  let headers: any = {
    "Content-Type": "application/json",
    Authorization: token
  };
  const response = await axios.get(`${BASE_URL}/users/list`, {
    headers
  });
  return response;
}

export async function updateUser(id: any, payload: any) {
  const token = await getJwtToken();
  const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
  let headers: any = {
    "Content-Type": "application/json",
    Authorization: token
  };
  const response = await axios.patch(`${BASE_URL}/users/${id}`, payload, {
    headers
  });
  return response;
}
