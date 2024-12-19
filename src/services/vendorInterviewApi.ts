import axios from "axios";
import { getJwtToken } from "../utils/utils";

export async function interviewsList() {
    const token = await getJwtToken();
    const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
    let headers: any = {
      "Content-Type": "application/json",
      Authorization: token
    };
    const response = await axios.get(`${BASE_URL}/vendors/get-interviews`, {
      headers
    });
    return response;
  }

  export async function createVendorInterview(data: any) {
    const token = await getJwtToken();
    const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
    let headers: any = {
      "Content-Type": "application/json",
      Authorization: token
    };
    const response = await axios.post(`${BASE_URL}/vendors/create-interview`, data, {
      headers
    });
    return response;
  }

  export async function updateVendorInterview(id: any, values: any) {
    const token = await getJwtToken();
    const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
    let headers: any = {
      "Content-Type": "application/json",
      Authorization: token
    };
    const response = await axios.patch(`${BASE_URL}/vendors/update-interview/${id}`, values, {
      headers
    });
    return response;
  }

  export async function deleteVendorInterview(id: string) {
    const token = await getJwtToken();
    const BASE_URL: string = import.meta.env.VITE_API_BASE_URL;
    const headers = {
      Authorization: token,
    };
    const response = await axios.delete(`${BASE_URL}/vendors/delete-interview/${id}`, { headers });
    return response;
  }