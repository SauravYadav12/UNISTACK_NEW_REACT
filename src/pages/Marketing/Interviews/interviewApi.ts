import axios from "axios";
import { getJwtToken } from "../../../utils/utils";

export async function interviewsList() {
    const token = await getJwtToken();
    const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
    let headers: any = {
      "Content-Type": "application/json",
      Authorization: token
    };
    const response = await axios.get(`${BASE_URL}/interviews/get-interviews`, {
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