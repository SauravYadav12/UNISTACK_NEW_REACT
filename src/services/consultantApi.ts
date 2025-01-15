import axios from "axios";
import { getJwtToken } from "../utils/utils";

export async function consultantsList(){
    const token = await getJwtToken()
    const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
    let headers: any = {
      "Content-Type": "application/json",
      Authorization: token
    };
    const response = await axios.get(`${BASE_URL}/consultants/get-consultants`, {
      headers
    });
    return response;
}

export async function createConsultant(data: any) {
    const token = await getJwtToken();
    const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
    let headers: any = {
      "Content-Type": "application/json",
      Authorization: token
    };
    const response = await axios.post(`${BASE_URL}/consultants/create-consultant`, data, {
      headers
    });
    return response;
}

export async function updateConsultant(id: any, values: any) {
    const token = await getJwtToken();
    const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
    let headers: any = {
      "Content-Type": "application/json",
      Authorization: token
    };
    const response = await axios.patch(`${BASE_URL}/consultants/update-consultant/${id}`, values, {
      headers
    });
    return response;
}

export async function deleteConsultant(id: string) {
    const token = await getJwtToken();
    const BASE_URL: string = import.meta.env.VITE_API_BASE_URL;
    const headers = {
      Authorization: token,
    };
    const response = await axios.delete(`${BASE_URL}/consultants/delete-consultant/${id}`, { headers });
    return response;
}