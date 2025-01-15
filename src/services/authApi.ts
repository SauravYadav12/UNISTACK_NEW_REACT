import axios from "axios";

export async function signup(data: any) {
  const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
  let headers: any = {
    "Content-Type": "application/json",
    // 'Authorization': 'JWT fefege...'
  };
  const response = await axios.post(`${BASE_URL}/users/signup`, data, {
    headers,
  });
  return response;
}

export async function login(data: any) {
  const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
  let headers: any = {
    "Content-Type": "application/json",
    // 'Authorization': 'JWT fefege...'
  };
  const response = await axios.post(`${BASE_URL}/users/login`, data, {
    headers,
  });
  return response;
}
