import { SalaryStructure } from '../components/salary/SalaryForm';
import { axiosClient } from '../config/axios.config';
import { ApiQueryRes, PaginationResult } from '../Interfaces/apiRes';
import { UserProfile } from '../Interfaces/profile';

export type SalaryStructRes = Pick<
  UserProfile,
  | '_id'
  | 'email'
  | 'employeeId'
  | 'name'
  | 'photo'
  | 'dob'
  | 'phoneNumber'
  | 'user'
> & {
  salaryStructure: SalaryStructure;
};

const salaryStructureApi = {
  async save(id: string, payload: Partial<SalaryStructure>) {
    const { data } = await axiosClient.post<ApiQueryRes<SalaryStructure>>(
      `/salary-structures/${id}`,
      payload
    );
    return data.data;
  },

  async getById(id: string) {
    const { data } = await axiosClient.get<ApiQueryRes<SalaryStructRes>>(
      `/salary-structures/${id}`
    );
    return data.data;
  },

  async list(query?: string, signal?: AbortSignal) {
    const { data } = await axiosClient.get<
      ApiQueryRes<PaginationResult<SalaryStructRes>>
    >(`/salary-structures?${query || ''}`, {
      signal,
    });
    return data.data;
  },
};
export default salaryStructureApi;
