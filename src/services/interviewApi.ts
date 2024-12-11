import axios from "axios";
import { getJwtToken } from "../utils/utils";

export async function interviewsList(query: any) {
    const token = await getJwtToken();
    const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
    let headers: any = {
      "Content-Type": "application/json",
      Authorization: token
    };
    const response = await axios.get(`${BASE_URL}/interviews/get-interviews?interviewStatus=${query}`, {
      headers
    });
    return response;
  }

  export async function createInterview(data: any) {
    const token = await getJwtToken();
    const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
    let headers: any = {
      "Content-Type": "application/json",
      Authorization: token
    };
    const response = await axios.post(`${BASE_URL}/interviews/create-interview`, data, {
      headers
    });
    return response;
  }

  export async function updateInterview(id: any, values: any) {
    const token = await getJwtToken();
    const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
    let headers: any = {
      "Content-Type": "application/json",
      Authorization: token
    };
    const response = await axios.patch(`${BASE_URL}/interviews/update-interview/${id}`, values, {
      headers
    });
    return response;
  }

  export async function deleteInterview(id: string) {
    const token = await getJwtToken();
    const BASE_URL: string = import.meta.env.VITE_API_BASE_URL;
    const headers = {
      Authorization: token,
    };
    const response = await axios.delete(`${BASE_URL}/interviews/delete-interview/${id}`, { headers });
    return response;
  }