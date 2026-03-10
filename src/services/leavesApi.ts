import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import { CreateLeavePayload, iLeave } from '../Interfaces/leaves';
import { axiosClient } from '../config/axios.config';

export async function getLeaves(query = '') {
  const response = await axiosClient.get<ApiQueryRes<PaginationResult<iLeave>>>(
    `/leaves?${query}`
  );
  return response;
}

export async function createLeave(data: CreateLeavePayload) {
  const response = await axiosClient.post<ApiQueryRes<iLeave>>(`/leaves`, data);
  return response;
}


export async function updateLeave(id:string,params:Partial<iLeave>) {
  const response = await axiosClient.patch<ApiQueryRes<iLeave>>(`/leaves/${id}`, params);
  return response.data.data;
}