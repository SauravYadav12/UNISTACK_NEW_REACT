import { axiosClient } from '../config/axios.config';
import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import { Payslip } from '../Interfaces/payslip';

export const payslipApi = {
  createPayslip: async (
    data: Omit<Payslip, '_id' | 'createdAt' | 'updatedAt'>
  ) => {
    return (await axiosClient.post<ApiQueryRes<Payslip>>('/payslips', data))
      .data.data;
  },

  getPayslipById: async (id: string) => {
    return (await axiosClient.get<ApiQueryRes<Payslip>>(`/payslips/${id}`)).data
      .data;
  },

  listPayslips: async (query?: string, signal?: AbortSignal) => {
    return (
      await axiosClient.get<ApiQueryRes<PaginationResult<Payslip>>>(`/payslips?${query || ''}`, {
        signal,
      })
    ).data.data;
  },
};
