import axios from "axios";
import { getJwtToken } from "../utils/utils";

export async function teamsList(){
    const token = await getJwtToken()
    const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
    let headers: any = {
      "Content-Type": "application/json",
      Authorization: token
    };
    const response = await axios.get(`${BASE_URL}/teams/get-teams`, {
      headers
    });
    return response;
}

export async function createTeam(data: any) {
    const token = await getJwtToken();
    const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
    let headers: any = {
      "Content-Type": "application/json",
      Authorization: token
    };
    const response = await axios.post(`${BASE_URL}/teams/create-team`, data, {
      headers
    });
    return response;
}

export async function updateTeam(id: any, values: any) {
    const token = await getJwtToken();
    const BASE_URL: any = import.meta.env.VITE_API_BASE_URL;
    let headers: any = {
      "Content-Type": "application/json",
      Authorization: token
    };
    const response = await axios.patch(`${BASE_URL}/teams/update-team/${id}`, values, {
      headers
    });
    return response;
}

export async function deleteTeam(id: string) {
    const token = await getJwtToken();
    const BASE_URL: string = import.meta.env.VITE_API_BASE_URL;
    const headers = {
      Authorization: token,
    };
    const response = await axios.delete(`${BASE_URL}/teams/delete-team/${id}`, { headers });
    return response;
}